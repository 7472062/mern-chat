import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Login.css'

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if(!formData.username || !formData.password) {
            setError('아이디, 비밀번호를 모두 입력해 주세요.');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();

            if (response.ok) {
                // 로그인 성공
                if (data.accessToken) {
                    sessionStorage.setItem('accessToken', data.accessToken);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                }
                navigate('/chat');
            } else {
                // 로그인 실패
                setError(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('서버 에러. 다시 시도해 주세요.')
        }
    }

    return (
        <div className="auth-container">
            <form className='auth-form' onSubmit={handleSubmit}>
                {error && <p className="auth-error">{error}</p>}
                <div className='form-group'>
                    <label htmlFor="username">아이디</label>
                    <input
                        type='text'
                        id='username'
                        name='username'
                        value={formData.username}
                        onChange={handleChange}
                    />
                </div>
                <div className='form-group'>
                    <label htmlFor="password">비밀번호</label>
                    <input
                        type='password'
                        id='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className='auth-button'>로그인</button>
            </form>
        </div>
    );
}

export default Login;