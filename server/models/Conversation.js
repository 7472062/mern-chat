const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [messageSchema],
}, {
    timestamps: true
});

conversationSchema.pre('save', function(next) {
    if (this.isModified('participants')) {
        this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
    }
    next();
});

module.exports = mongoose.model('Conversation', conversationSchema);