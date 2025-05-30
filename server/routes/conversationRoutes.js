const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware.js');
const { getMessagesForConversation } = require('../controllers/conversationController');

router.get('/:friendId', protect, getMessagesForConversation);

module.exports = router;