const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
    res.send('Hello');
});

app.get('/test', (req, res) => {
    res.json({message: 'API working'});
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});