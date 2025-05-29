import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../api/apiService";

import './Chat.css';

function Chat() {
    const [user, setUser] = useState(null)
    const navigate = useNavigate();

    // 검색 기능 관련 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    
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
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); 

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    }

    const handleAddFriend = async (friendId) => {
        // 친구 추가 API 호출 코드 추가

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
                <div className="navbar-search">
                    <input 
                        type="text" 
                        placeholder="Search user with #id" 
                        className="user-search-input" 
                        value={searchTerm}
                        onChange={handleSearchChange}
                    /> 
                    {searchResults && (
                        <div className="search-result-container">
                            <img
                                src={searchResults.profilePic || '/default-avatar.png'}
                                className="search-result-avatar"
                            />
                            <span className="search-result-nickname">
                                {searchResults.nickname} <span className="search-result-id">#{searchResults.id}</span>
                            </span>
                            {user.id !== searchResults.id && (
                                <button
                                    onClick={() => handleAddFriend(searchResults.id)}
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
                        <div className="user-id">#{user.id}</div>
                    </span>
                </div>
                <button onClick={handleLogout} className="logout">Logout</button>
            </nav>
            <div className="chat-content-area">

            </div>
        </div>
    );
}

export default Chat;