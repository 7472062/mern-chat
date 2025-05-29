const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
    const { username, nickname, password, profilePic } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(409).json({ message: '사용할 수 없는 아이디입니다.' });
        }

        // 회원가입 성공, 유저 정보 등록
        const newUser = new User({ username, nickname, password, profilePic });
        await newUser.save();

        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(val => val.message);
          return res.status(400).json({ message: messages.join('\n') });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ message: '서버 에러. 다시 시도해 주세요.' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
          return res.status(401).json({ message: '아이디 혹은 비밀번호가 틀렸습니다.' });
        }

        const isMatch = await user.verifyPassword(password);
        if (!isMatch) {
          return res.status(401).json({ message: '아이디 혹은 비밀번호가 틀렸습니다.' });
        }

        // 로그인 성공, 페이로드 생성
        const payload = { id: user._id };

        // 액세스 토큰 생성
        const accessToken = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        // 리프레시 토큰 생성
        const refreshToken = jwt.sign(
          payload,
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        // HttpOnly 쿠키 설정
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7일 (밀리초 단위)
        });

        res.json({
          message: '로그인 성공',
          accessToken: accessToken,
          user: { id: user._id, nickname: user.nickname, profilePic: user.profilePic, friends: user.friends },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: '서버 에러. 다시 시도해 주세요.' });
    }
});

// 액세스 토큰 재발급 라우트
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: '리프레시 토큰이 존재하지 않습니다.' });
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const payload = { id: decoded.id };
    const newAccessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'strict' });
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: '유효하지 않거나 만료된 토큰입니다. 다시 로그인해 주세요.' });
    }
    return res.status(500).json({ message: '서버 에러. 다시 시도해 주세요.' });
  }
});

// 로그아웃 라우트
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'strict' });
  res.json({ message: '로그아웃 성공' });
});

module.exports = router;