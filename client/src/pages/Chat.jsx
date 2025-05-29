import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../api/apiService";

import './Chat.css';

function Chat() {
    const [user, setUser] = useState(null)
    const navigate = useNavigate();

    // 검색 기능 관련 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef(null);

    // 친구 목록 관련 상태
    const [friendsList, setFriendsList] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        const storedUser = sessionStorage.getItem('user');

        if (!accessToken || !storedUser) {
            navigate('/');
        } else {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('User parse failed:', error);
                sessionStorage.clear();
                navigate('/');
            }
        }
    }, [navigate]);

    // 검색창 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setSearchTerm('');
                setIsSearchFocused(false);
                setSearchResults(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 검색어 변경 시 호출
    useEffect(() => {
        const processSearchTerm = (term) => {
            // # 으로 시작하면 # 제거
            term = term.trim();
            return term.startsWith('#') ? term.substring(1) : term;
        }

        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            const processedUserId = processSearchTerm(searchTerm);
            if (!processedUserId) {
                setSearchResults(null);
                return;
            }

            setSearchResults(null);

            try {
                const data = await apiService.get(`/users/search?id=${encodeURIComponent(processedUserId)}`);

                if (data) {
                    setSearchResults(data);
                } else {
                    setSearchResults(null);
                }
            } catch (error) {
                console.error("Search failed:", error);
                setSearchResults(null);
            }
        }, 250);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); 

    // 친구 상세 목록 가져오기
    useEffect(() => {
        if (user && user.friends) {
            const friendDetails = async () => {
                try {
                    const friendsData = await apiService.get('/users/my-friends');
                    setFriendsList(friendsData || []);
                } catch (error) {
                    console.error('Friends list error:', error);
                    setFriendsList([]);
                }
            }
            friendDetails();
        } else {
            setFriendsList([]);
        }
    }, [user]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    }

    const handleAddFriend = async (friendIdToAdd) => {
        if (!user || !friendIdToAdd) return;

        try {
            const response = await apiService.post('/users/friends/add', { friendId: friendIdToAdd });

            setUser(prevUser => {
                const updatedFriends = response.friends;
                const updatedUser = { ...prevUser, friends: updatedFriends };

                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
            });

            setSearchTerm('');
+           setSearchResults(null);
+           setIsSearchFocused(false);
        } catch (error) {
            console.error('Failed to add friend:', error);
        }
    }

    const handleLogout = async () => {
        // 웹소켓 연결 해제 코드 추가
    
        try {
            await apiService.post('/auth/logout');
        } catch (error) {
            console.error("Logout API call failed:", error);
        } finally {
            sessionStorage.clear();
            navigate('/');
        }
    }

    if (!user) {
        return null;
    }

    const profilePic = user.profilePic || '/default-avatar.png';

    return (
        <div className="chat-page-container">
            <nav className="navbar">
                <div className="navbar-brand">Concord</div>
                <div className="navbar-search" ref={searchContainerRef}>
                    <input 
                        type="text" 
                        placeholder="Search user with #id" 
                        className="user-search-input" 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsSearchFocused(true)}
                    /> 
                    {isSearchFocused && searchResults && (
                        <div className="search-result-container">
                            <img
                                src={searchResults.profilePic || '/default-avatar.png'}
                                className="search-result-avatar"
                            />
                            <span className="search-result-nickname">
                                {searchResults.nickname} <span className="search-result-id">#{searchResults.id}</span>
                            </span>
                            {user.id !== searchResults.id && (!user.friends.includes(searchResults.id)) && (
                                <button
                                    onClick={() => {
                                        handleAddFriend(searchResults.id);
                                    }}
                                    className="add-friend-button"
                                >
                                    <span className="add-friend-button-plus">+</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="navbar-user">
                    <img src={profilePic} className="profile-picture"/>
                    <span className="nickname">{user.nickname} 
                        <span className="user-id" style={{display: 'block'}}>#{user.id}</span>
                    </span>
                </div>
                <button onClick={handleLogout} className="logout">Logout</button>
            </nav>
            <div className="chat-content-area">
                <div className="friend-list-panel">
                    {friendsList.length > 0 ? (
                        <ul className="friend-list">
                            {friendsList.map((friend) => (
                                <li 
                                    key={friend._id} 
                                    className={`friend-item-box ${selectedFriend === friend._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedFriend(friend._id)}
                                >
                                    <img
                                        src={friend.profilePic || '/default-avatar.png'}
                                        className="friend-avatar"
                                    />
                                    <span className="friend-nickname">{friend.nickname}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-friends-message">No Friends</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;