const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();

// ✅ Add these right after app is initialized
app.set('trust proxy', 1);        // Render uses proxies, this prevents rate-limit crash
app.set('view engine', 'ejs');    // Enables res.render() to load .ejs views

// ✅ Rate limiter for all requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);


// ✅ Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

// ✅ Helmet for secure HTTP headers
app.use(helmet());

// ✅ Parse form data and sanitize input
app.use(express.urlencoded({ extended: false }));
app.use(xss());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Secure session using memory store (Render compatible)
app.use(session({
  secret: process.env.SESSION_SECRET || 'please_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// ✅ Multer config for profile picture uploads
const upload = multer({
  dest: path.join(__dirname, 'public/uploads/profiles'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// ✅ Example profile update route
app.post('/profile', upload.single('photo'), (req, res) => {
  const { username, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  db.run('UPDATE users SET profilePic = ?, bio = ? WHERE username = ?', [profilePic, bio, username], function (err) {
    if (err) return res.send('Error updating profile.');
    res.redirect('/profile');
  });
});

// ✅ Apply login limiter
app.use('/login', loginLimiter);

// ✅ Load routes
app.use('/', require('./routes/auth'));
app.use('/blog', require('./routes/blog'));
app.use('/profile', require('./routes/profile'));
app.use('/friends', require('./routes/friends'));
app.use('/chat', require('./routes/chat'));

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
