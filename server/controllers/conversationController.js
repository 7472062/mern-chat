const Conversation = require('../models/Conversation.js');

exports.getMessagesForConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const friendId = req.params.friendId;

        const participantsArray = [currentUserId, friendId].sort((a, b) => a.toString().localeCompare(b.toString()));

        const conversation = await Conversation.findOne({
            participants: { $all: participantsArray }
        }).populate({
            path: 'messages.from',
            select: 'nickname profilePic _id'
        });

        if (!conversation) {
            return res.status(200).json([]); // 대화가 없으면 빈 배열 반환
        }

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error("Error in getMessagesForConversation controller: ", error.message);
        res.status(500).json({ error: "서버 에러" });
    }
}