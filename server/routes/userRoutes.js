const express = require('express');
const User = require('../models/User.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Conversation = require('../models/Conversation.js');

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

router.get('/my-friends', protect, async (req, res) => {
    try {
        const currentUserFriendDetails = await User.findById(req.user._id)
            .populate({
                path: 'friends',
                select: '_id nickname profilePic',
            });
        if (!currentUserFriendDetails) {
            return res.status(404).json({ message: 'Current user not found.' });
        }
        if (!Array.isArray(currentUserFriendDetails.friends) || currentUserFriendDetails.friends.length === 0) {
            return res.json([]);
        }
        
        const sortedFriends = await Promise.all(
            currentUserFriendDetails.friends.map(async (friend) => {
                const participantsArray = [currentUserFriendDetails._id, friend._id].sort((a, b) => a.toString().localeCompare(b.toString()));
                
                const conversation = await Conversation.findOne(
                    { participants: { $all: participantsArray, } },
                    'updatedAt' // updatedAt 가져오기
                );

                return {
                    _id: friend._id,
                    nickname: friend.nickname,
                    profilePic: friend.profilePic,
                    lastActivity: conversation ? conversation.updatedAt : null,
                };
            })
        );

        sortedFriends.sort((a, b) => {
            if (b.lastActivity === null) return -1;
            if (a.lastActivity === null) return 1;
            return new Date(b.lastActivity) - new Date(a.lastActivity);
        });

        res.json(sortedFriends);

    } catch (error) {
        console.error('Friends list error:', error);
        res.status(500).json({ message: '서버 에러.' });
    }
});

router.post('/profile-picture', protect, uploadProfilePic.single('profilePicFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '업로드할 파일을 선택해주세요.' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        if (user.profilePic) {
            const oldPicPath = path.join(__dirname, '..', '..', user.profilePic.substring(1));
            if (fs.existsSync(oldPicPath)) {
                fs.unlink(oldPicPath, (err) => {
                    if (err) {
                        console.error("이전 프로필 사진 삭제 실패:", oldPicPath, err);
                    } else {
                        console.log("이전 프로필 사진 삭제 성공:", oldPicPath);
                    }
                });
            } else {
                console.warn("삭제할 이전 프로필 사진을 시스템에서 찾을 수 없음:", oldPicPath);
            }
        }

        const newProfilePicUrl = `/uploads/profile_pictures/${req.file.filename}`;
        user.profilePic = newProfilePicUrl;
        await user.save()

        res.json({
            message: '프로필 사진 변경 완료',
            user: {
                id: user._id,
                profilePic: newProfilePicUrl,
            }
        });

    } catch (error) {
        console.error('프로필 사진 변경 중 서버 오류:', error);
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: '프로필 사진 변경 중 서버 오류가 발생했습니다.' });
    }
});

module.exports = router;