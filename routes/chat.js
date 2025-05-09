const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Friend = require('../models/Friend');

// View chat inbox — list of users you have messaged
router.get('/', async (req, res) => {
  const currentUser = req.session.user.username;

  try {
    const chats = await Message.getChatListForUser(currentUser);
    res.render('chat', { chats });
  } catch (err) {
    console.error(err);
    res.send('Error loading chats.');
  }
});

// View specific chat room
router.get('/:username', async (req, res) => {
  const currentUser = req.session.user.username;
  const otherUser = req.params.username;

  try {
    const isFriend = await Friend.areMutualFriends(currentUser, otherUser);
    if (!isFriend) return res.send('You must be friends to view this chat.');

    const messages = await Message.getConversation(currentUser, otherUser);
    res.render('chat-room', {
      currentUser,
      otherUser,
      messages
    });
  } catch (err) {
    console.error(err);
    res.send('Could not load chat room.');
  }
});

// Send message
router.post('/:username', async (req, res) => {
  const sender = req.session.user.username;
  const recipient = req.params.username;
  const message = req.body.message;

  try {
    const isFriend = await Friend.areMutualFriends(sender, recipient);
    if (!isFriend) return res.status(403).send('You must be friends to send messages.');

    await Message.send({ sender, recipient, message });
    res.redirect('/chat/' + recipient);
  } catch (err) {
    console.error(err);
    res.send('Failed to send message.');
  }
});

module.exports = router;
