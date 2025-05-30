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

            try {
                let conversation = await Conversation.findOneAndUpdate(
                    { participants: { $all: [from, to].sort() } },
                    {
                        $push: {
                            messages: {
                                from: from,
                                to: to,
                                text: text,
                            }
                        },
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                ).populate('messages.from', 'nickname profilePic')
                 .populate('messages.to', 'nickname profilePic');

                const newMessage = conversation.messages[conversation.messages.length - 1];

                io.to(to.toString()).emit('receiveMessage', newMessage);
                socket.emit('receiveMessage', newMessage);

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