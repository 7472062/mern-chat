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

        // 로그인 성공, JWT 생성
        const payload = { id: user._id };

        const token = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({
        message: '로그인 성공',
          token: token,
          user: { id: user._id, nickname: user.nickname, profilePic: user.profilePic },
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: '서버 에러. 다시 시도해 주세요.' });
    }
});

module.exports = router;