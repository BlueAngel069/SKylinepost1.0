const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');

// Send a friend request
router.post('/request/:username', async (req, res) => {
  const requester = req.session.user.username;
  const recipient = req.params.username;

  if (requester === recipient) return res.send('You cannot friend yourself.');

  try {
    await Friend.sendRequest(requester, recipient);
    res.redirect('/profile/' + recipient);
  } catch (err) {
    console.error(err);
    res.send('Failed to send request.');
  }
});

// Accept a friend request
router.post('/accept/:username', async (req, res) => {
  const recipient = req.session.user.username;
  const requester = req.params.username;

  try {
    await Friend.acceptRequest(recipient, requester);
    res.redirect('/friends');
  } catch (err) {
    console.error(err);
    res.send('Failed to accept request.');
  }
});

// View pending friend requests
router.get('/', async (req, res) => {
  const currentUser = req.session.user.username;

  try {
    const requests = await Friend.getPendingRequestsForUser(currentUser);
    res.render('friends', { requests });
  } catch (err) {
    console.error(err);
    res.send('Could not load requests.');
  }
});

module.exports = router;
