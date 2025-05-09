const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const helmet = require('helmet');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit'); // ✅ NEW

dotenv.config();
const app = express();

// ✅ Rate limiter for all requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// ✅ Rate limiter specifically for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit to 5 login attempts every 15 mins
  message: 'Too many login attempts. Please try again later.'
});

// Configure Redis client
const redisClient = redis.createClient({
  legacyMode: true,
  socket: {
    host: 'localhost',
    port: 6379,
  }
});
redisClient.connect().catch(console.error);

// Use Helmet to set secure headers
app.use(helmet());

// Parse form data and clean XSS
app.use(express.urlencoded({ extended: false }));
app.use(xss());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Secure session
app.use(session({
  store: new RedisStore({ client: redisClient }),
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

// Strong multer config
const upload = multer({
  dest: path.join(__dirname, 'public/uploads/profiles'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Optional: Regenerate session after login (place this in your login POST handler)
// req.session.regenerate(() => { req.session.user = { username }; res.redirect(...); });

// Profile picture route (adjust as needed)
app.post('/profile', upload.single('photo'), (req, res) => {
  const { username, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  db.run('UPDATE users SET profilePic = ?, bio = ? WHERE username = ?', [profilePic, bio, username], function (err) {
    if (err) return res.send('Error updating profile.');
    res.redirect('/profile');
  });
});

// Apply login limiter ONLY to /login route
app.use('/login', loginLimiter);

// Load routes
app.use('/', require('./routes/auth'));
app.use('/blog', require('./routes/blog'));
app.use('/profile', require('./routes/profile'));
app.use('/friends', require('./routes/friends'));
app.use('/chat', require('./routes/chat'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
