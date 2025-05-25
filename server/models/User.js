const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, '아이디를 입력하세요.'],
        unique: true,
        trim: true,
        minlength: [4, '아이디의 최소 길이는 4자입니다.'],
        maxlength: [12, '아이디의 최대 길이는 12자입니다.'],
    },
    nickname: {
        type: String,
        required: [true, '닉네임을 입력하세요.'],
        unique: false,
        trim: true,
        minlength: [2, '닉네임의 최소 길이는 2자입니다.'],
        maxlength: [12, '닉네임의 최대 길이는 12자입니다.'],
    },
    password: {
        type: String,
        required: [true, '비밀번호를 입력하세요.'],
        trim: true,
        minlength: [6, '비밀번호의 최소 길이는 6자입니다.'],
        maxlength: [24, '비밀번호의 최대 길이는 24자입니다.'],
        select: false,
    },
    profilePic: {
        type: String,
        default: '',
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.verifyPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', userSchema);

module.exports = User;