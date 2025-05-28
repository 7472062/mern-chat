import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './Login.css'

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
            const accessToken = sessionStorage.getItem('accessToken');
            if (accessToken) {
                navigate('/chat');
            }
        }, [navigate]);

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
                credentials: 'same-origin',
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
            setError('로그인 요청 중 에러 발생, 다시 시도해 주세요.')
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
                <p className="auth-switch" style={{ marginTop: '1rem' }}>
                    계정이 없으신가요? <Link to="/register">가입하기</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;