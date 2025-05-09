const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) return res.status(500).send('Database error.');
      if (existingUser) return res.send('Username already taken.');

      const hash = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (username, password, last_username_change) VALUES (?, ?, ?)',
        [username, hash, new Date().toISOString()],
        function (err) {
          if (err) return res.status(500).send('Registration failed.');
          req.session.user = { username };
          res.redirect('/blog/dashboard');
        }
      );
    });
  } catch (e) {
    res.status(500).send('Something went wrong.');
  }
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).send('Invalid login.');

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).send('Invalid login.');

      req.session.user = { username };
      res.redirect('/blog/dashboard');
    } catch (e) {
      res.status(500).send('Login error.');
    }
  });
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Redirect root URL
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;
