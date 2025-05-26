const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 토큰 추출
            token = req.headers.authorization.split(' ')[1];

            // id 추출 및 조회
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: '인증 실패. 사용자를 찾을 수 없습니다.' });
            }

            next();
        } catch (error) {
            console.error('Access token error:', error);
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: '유효하지 않거나 만료된 토큰입니다. 다시 로그인해 주세요.' });
            }
            return res.status(500).json({ message: '서버 에러. 다시 시도해 주세요.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: '액세스 토큰이 존재하지 않습니다.' });
    }
};

module.exports = { protect };