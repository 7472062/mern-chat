import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import './Register.css';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        nickname: '',
        password: '',
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        if (accessToken) {
            navigate('/chat');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.nickname || !formData.password) {
            setError('모든 필드를 입력해 주세요.');
            return;
        }
        if (formData.username.length < 4 || formData.username.length > 12) {
            setError('아이디의 길이는 4~12자여야 합니다.');
            return;
        }
        if (formData.nickname.length < 2 || formData.nickname.length > 12) {
            setError('닉네임의 길이는 2~12자여야 합니다.');
            return;
        }
        if (formData.password.length < 6 || formData.password.length > 24) {
            setError('비밀번호의 길이는 6~24자여야 합니다.');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // 회원가입 성공
                setFormData({ username: '', nickname: '', password: '' });
                alert("회원가입 완료!");
                navigate('/login');
            } else {
                // 회원가입 실패
                setError(data.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('회원가입 요청 중 에러 발생, 다시 시도해 주세요.')
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
                    <label htmlFor="nickname">닉네임</label>
                    <input
                        type='text'
                        id='nickname'
                        name='nickname'
                        value={formData.nickname}
                        onChange={handleChange}
                    />
                </div>
                <div className='form-group password-group'>
                    <label htmlFor="password">비밀번호</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            id='password' 
                            name='password' 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                        <button 
                            type="button" 
                            onClick={toggleShowPassword} 
                            className="password-toggle-button"
                        >
                            {showPassword ? <FaEye /> : <FaEyeSlash />} {/* 아이콘으로 변경 */}
                        </button>
                    </div>
                </div>
                <button type="submit" className='auth-button'>회원가입</button>
                <p className="auth-switch" style={{ marginTop: '1rem' }}>
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;