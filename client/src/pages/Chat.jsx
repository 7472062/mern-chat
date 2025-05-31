import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../api/apiService";
import io from 'socket.io-client';
import { IoSend } from 'react-icons/io5';

import './Chat.css';

const SOCKET_SERVER_URL = 'http://localhost:5050';

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

    // 채팅 관련 상태
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    
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

    // 친구 선택 변경 시 메세지 불러오기
    useEffect(() => {
        if (!selectedFriend) {
            setMessages([]);
            return;
        }
        const fetchMessages = async () => {
            try {
                const fetchedMessages = await apiService.get(`/conversations/${selectedFriend}`);
                setMessages(fetchedMessages || []);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
                setMessages([]);
            }
        }
        fetchMessages();
    }, [selectedFriend, user])

    // Socket.IO 연결 및 이벤트 리스너 설정
    useEffect(() => {
        if (!user) return;

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io(SOCKET_SERVER_URL, {
            auth: { token: sessionStorage.getItem('accessToken') }
        });
        socketRef.current = newSocket;

        newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
        newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
        newSocket.on('connect_error', (error) => console.error('Socket connection error:', error));

        newSocket.on('receiveMessage', (incomingMessage) => {
            if (selectedFriend && incomingMessage && incomingMessage.from) {
                const senderId = incomingMessage.from._id;
                const currentUserId = user.id;
            
                if (senderId === selectedFriend || senderId === currentUserId) {
                    setMessages(prevMessages => [...prevMessages, incomingMessage]);
                }
            }
        });
        
        newSocket.on('messageError', (errorData) => console.error('Message sending error:', errorData));

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user, selectedFriend]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend || !socketRef.current || !socketRef.current.connected) {
            return;
        }
        const messageData = {
            to: selectedFriend,
            text: newMessage.trim(),
        };
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.disconnect();
            console.log('Socket disconnected on logout');
        }
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
                <div className="chat-window">
                    {selectedFriend ? (
                        <>
                            <div className="messages-list">
                                {messages.map((msg, index) => {
                                    const isFirstMessage = index === 0;
                                    const prevMessage = !isFirstMessage ? messages[index - 1] : null;

                                    // 발신자 정보를 표시할지 여부 결정
                                    let showSenderInfo = false;
                                    if (isFirstMessage || !prevMessage || prevMessage.from._id !== msg.from._id) {
                                        showSenderInfo = true;
                                    } else {
                                        if (msg.createdAt.substring(0, 16) !== prevMessage.createdAt.substring(0, 16)) {
                                            showSenderInfo = true;
                                        }
                                    }
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`message-item ${msg.from._id === user.id ? 'my-message' : 'other-message'} ${showSenderInfo ? 'first-in-group' : 'continuation-message'}`}
                                        >
                                            {showSenderInfo && (
                                                <div className="message-sender-info">
                                                    <img src={msg.from.profilePic || '/default-avatar.png'} className="message-avatar" />
                                                    <span className="message-sender">{msg.from.nickname}</span>
                                                </div>
                                            )}
                                            <div className="message-content">
                                                {showSenderInfo && (
                                                    <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                )}
                                                <p className="message-text">{msg.text}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="message-input-form">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="message-input"
                                    autoFocus
                                />
                                <button type="submit" className="send-button"><IoSend /></button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Select a Friend</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;