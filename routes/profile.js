const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${req.session.user.username}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// GET profile page
router.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;
  db.get('SELECT * FROM profiles WHERE username = ?', [username], (err, row) => {
    if (err) return res.send('Database error.');
    res.render('profile', { profile: row || {}, username });
  });
});

// POST profile update
router.post('/', upload.single('photo'), (req, res) => {
  const currentUsername = req.session.user.username;
  const { username: newUsername, bio } = req.body;
  const photo = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  db.get('SELECT last_username_change FROM users WHERE username = ?', [currentUsername], (err, row) => {
    if (err) return res.send('Database read error.');
    const now = new Date();
    const lastChange = row?.last_username_change ? new Date(row.last_username_change) : new Date(0);
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;

    if (currentUsername !== newUsername && (now - lastChange < thirtyDays)) {
      return res.send('You can only change your username once every 30 days.');
    }

    db.get('SELECT * FROM users WHERE username = ? AND username != ?', [newUsername, currentUsername], (err, existing) => {
      if (existing) return res.send('Username already taken.');

      // Update user table
      db.run(`
        UPDATE users SET username = ?, last_username_change = ?
        WHERE username = ?
      `, [newUsername, now.toISOString(), currentUsername]);

      // Update or insert into profiles table
      db.run(`
        INSERT INTO profiles (username, bio, photo)
        VALUES (?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          bio = excluded.bio,
          photo = COALESCE(excluded.photo, profiles.photo)
      `, [newUsername, bio, photo], () => {
        req.session.user.username = newUsername;
        res.redirect('/profile');
      });
    });
  });
});

module.exports = router;

// GET public profile by username
router.get('/:username', (req, res) => {
  const { username } = req.params;

  db.get('SELECT * FROM profiles WHERE username = ?', [username], (err, profile) => {
    if (err || !profile) return res.send('User not found.');

    db.all('SELECT * FROM posts WHERE author = ? ORDER BY date DESC', [username], (err2, posts) => {
      if (err2) return res.send('Error loading posts.');

      res.render('public-profile', {
        username,
        profile,
        posts
      });
    });
  });
});
