const multer = require('multer');
const path = require('path');

// 프로필 사진 저장 설정
const profilePicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/profile_pictures/';
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        if (req.user || !req. user.id) {
            return cb(new Error('사용자 ID를 찾을 수 없습니다.'));
        }
        const userId = req.user.id;
        cb(null, `${userId}${path.extname(file.originalname)}`);
    }
});

// 파일 필터
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('잘못된 파일'), false);
    }
};

const uploadProfilePic = multer({
    storage: profilePicStorage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB 파일 크기 제한
    },
    fileFilter: imageFileFilter
});

module.exports = { uploadProfilePic };