const express = require('express');
const User = require('../models/User.js');
const { protect } = require('../middlewares/authMiddleware.js');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/search', protect, async (req, res) => {
    const searchId = req.query.id;

    if (!searchId) {
        return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }

    try {
        const user = await User.findOne({ _id: searchId })

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({
            id: user._id,
            nickname: user.nickname,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ message: '서버 에러.' });
    }
});

router.post('/friends/add', protect, async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (!friendId) {
        return res.status(400).json({ message: '추가할 친구의 ID를 입력해 주세요.' });
    }
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ message: '유효하지 않은 친구 ID 형식입니다.' });
    }
    if (userId.equals(friendId)) {
        return res.status(400).json({ message: '자기 자신을 친구로 추가할 수 없습니다.' });
    }

    try {
        const currentUser = await User.findById(userId);
        const friendToAdd = await User.findById(friendId);

        if (!friendToAdd) {
            return res.status(404).json({ message: '추가하려는 사용자를 찾을 수 없습니다.' });
        }
        if (currentUser.friends.includes(friendId)) {
            return res.status(400).json({ message: '이미 친구로 추가된 사용자입니다.' });
        }

        currentUser.friends.push(friendId);
        await currentUser.save();

        res.json({
            friends: currentUser.friends
        });
    } catch (error) {
        console.error('친구 추가 중 에러 발생:', error);
        res.status(500).json({ message: '서버 에러.' });
    }
});

module.exports = router;