import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import './Chat.css';

function Chat() {
    const [user, setUser] = useState(null)
    const navigate = useNavigate();

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

    const handleLogout = () => {
        // 웹소켓 연결 해제 코드 추가
    
        sessionStorage.clear();
        navigate('/');
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
                    <input type="text" placeholder="Search user with #id" className="user-search-input" /> 
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