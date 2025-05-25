const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes.js');

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

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

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});