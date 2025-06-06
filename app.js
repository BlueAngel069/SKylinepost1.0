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

// ✅ Proxy trust for Render + EJS view setup
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ✅ Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// ✅ Login-specific limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

// ✅ Helmet & XSS protection
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(xss());

// ✅ Static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'please_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// ✅ Multer for file uploads
const upload = multer({
  dest: path.join(__dirname, 'public/uploads/profiles'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed.'));
  }
});

// ✅ Profile upload route (adjust if needed)
app.post('/profile', upload.single('photo'), (req, res) => {
  const { username, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  db.run('UPDATE users SET profilePic = ?, bio = ? WHERE username = ?', [profilePic, bio, username], (err) => {
    if (err) return res.send('Error updating profile.');
    res.redirect('/profile');
  });
});

// ✅ Apply login limiter
app.use('/login', loginLimiter);

// ✅ Route mounting
app.use('/', require('./routes/auth'));
app.use('/blog', require('./routes/blog'));
app.use('/profile', require('./routes/profile'));
app.use('/friends', require('./routes/friends'));
app.use('/chat', require('./routes/chat'));

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
