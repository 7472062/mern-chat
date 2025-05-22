const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = 5000;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('DB Connencted');
    } catch (err) {
        console.log('DB Connection Failed:', err.message);
        process.exit(1);
    }
}
connectDB();

app.get('/test', (req, res) => {
    res.json({message: 'API working'});
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});