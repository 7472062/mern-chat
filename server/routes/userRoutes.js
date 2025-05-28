const express = require('express');
const User = require('../models/User.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/search', protect, async (req, res) => {
    const searchId = req.query.id;

    if (!searchId) {
        return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }

    try {
        const user = await User.findOne({ username: searchId })

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({
            _id: user._id,
            nickname: user.nickname,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ message: '서버 에러.' });
    }
});

module.exports = router;