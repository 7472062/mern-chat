const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');
const http = require('http');
const initializeSocketIO = require('./socket/socketHandler.js');

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('DB Connected');
    } catch (err) {
        console.log('DB Connection Failed:', err.message);
        process.exit(1);
    }
}
connectDB();

app.get('/test', (req, res) => {
    res.json({message: 'API working'});
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/conversations', conversationRoutes);

// HTTP 서버 설정
const server = http.createServer(app);

initializeSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});