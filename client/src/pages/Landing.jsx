import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './Landing.css';

function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        if (accessToken) {
            navigate('/chat');
        }
    }, [navigate]);

    return (
        <div className='landing-container'>
            <h1>Concord</h1>
            <div className='button-group'>
                <Link to='/login'>
                    로그인
                </Link>
                <Link to='/register'>
                    회원가입
                </Link>
            </div>
        </div>
    );
}

export default Landing;