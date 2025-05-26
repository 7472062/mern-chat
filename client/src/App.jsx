import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

// 접근 제한 컴포넌트 Wrapper
const ProtectedElement = ({ children }) => {
  const accessToken = sessionStorage.getItem('accessToken');

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
    return (
        <Router>
            <div className='App'>
                <Routes>
                    {/* 공개 라우트 */}
                    <Route path='/' element={<Landing />}/>
                    <Route path='/login' element={<Login />}/>
                    <Route path='/register' element={<Register />}/>

                    {/* 제한 라우트 */}
                    <Route path='/chat' element={<ProtectedElement><Chat /></ProtectedElement>}/>

                    {/* 예외 라우트 */}
                    <Route path='*' element={<Navigate to='/' replace />}/>
                </Routes>
            </div>
        </Router>
    )
}

export default App;