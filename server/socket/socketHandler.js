const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Conversation = require('../models/Conversation.js');

function initializeSocketIO(httpServer) {
    const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
    });

    // Socket.IO 인증 미들웨어
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.log("Socket Auth: No token provided");
            return next(new Error("인증 에러: Token not provided"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = await User.findById(decoded.id);
            if (!socket.user) {
                console.log("Socket Auth: User not found");
                return next(new Error("인증 에러: User not found"));
            }
            console.log(`Socket Auth: User ${socket.user.nickname} authenticated`);
            next();
        } catch (err) {
            console.error("Socket auth error:", err.message);
            return next(new Error("인증 에러: Invalid token"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.nickname} (ID: ${socket.user.id}, Socket ID: ${socket.id})`);

        socket.join(socket.user.id.toString());

        socket.on('sendMessage', async (data) => {
            const { to, text } = data;
            const from = socket.user.id;

            if (!to || !text || !text.trim()) {
                console.error('Invalid message:', data);
                socket.emit('messageError', { message: '잘못된 메세지 형식입니다.', originalData: data });
                return;
            }
            const participantsArray = [from, to].sort((a, b) => a.toString().localeCompare(b.toString()));

            try {
                let conversation = await Conversation.findOne({ participants: { $all: participantsArray } });
                const newMessageData = { from: from, text: text, createdAt: new Date() }; // createdAt 추가

                if (conversation) {
                    conversation.messages.push(newMessageData);
                    await conversation.save();
                } else {
                    conversation = new Conversation({
                        participants: participantsArray,
                        messages: [newMessageData],
                    });
                    await conversation.save();
                }

                const populatedConversation = await Conversation.findById(conversation._id)
                    .populate('messages.from', 'nickname profilePic');

                const newMessageResponse = populatedConversation.messages[populatedConversation.messages.length - 1];
                
                io.to(to.toString()).emit('receiveMessage', newMessageResponse);
                socket.emit('receiveMessage', newMessageResponse);

                console.log(`Message from ${socket.user.nickname} to user ID ${to}: ${text}`);

            } catch (error) {
                console.error('Error handling message or saving to DB:', error);
                socket.emit('messageError', { message: '메시지 전송 중 서버 오류가 발생했습니다.', originalData: data });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.nickname} (Socket ID: ${socket.id})`);
        });
    });
}

module.exports = initializeSocketIO;