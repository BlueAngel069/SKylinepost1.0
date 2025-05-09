const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const Post = require('../models/Post');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Dashboard view
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const selectedCategory = req.query.category && req.query.category.trim() !== '' && req.query.category !== 'All' 
    ? req.query.category.trim() 
    : null;

  const query = `SELECT * FROM posts ORDER BY date DESC`;

  db.all(query, [], (err, allPosts) => {
    if (err) return res.send('Database error.');

    const cleanedPosts = allPosts.map(post => ({
      ...post,
      category: post.category ? post.category.trim() : 'General'
    }));

    const categories = [...new Set(cleanedPosts.map(p => p.category).filter(Boolean))];

    const filteredPosts = selectedCategory
      ? cleanedPosts.filter(post => post.category === selectedCategory)
      : cleanedPosts;

    res.render('dashboard', {
      user: req.session.user,
      posts: filteredPosts,
      categories,
      selectedCategory: selectedCategory || 'All'
    });
  });
});

// ✅ Create new post
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    let category = req.body.category?.trim();
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const finalCategory = category && category !== '' ? category : 'General';
    const author = req.session.user.username;
    const date = new Date().toLocaleString();

    const result = await Post.create({ title, content, author, date, category: finalCategory, image });

    res.json({
      id: result.id,
      title,
      content,
      author,
      date,
      category: finalCategory,
      image
    });
  } catch (err) {
    console.error('Post creation failed:', err);
    res.status(500).json({ error: 'Post creation failed' });
  }
});

// ✅ Delete
router.post('/delete/:id', async (req, res) => {
  await Post.delete(req.params.id);
  res.redirect('/blog/dashboard');
});

// ✅ Edit (GET)
router.get('/edit/:id', async (req, res) => {
  const post = await Post.getById(req.params.id);
  if (!post || post.author !== req.session.user.username) {
    return res.status(403).send('Unauthorized');
  }
  res.render('edit', { post });
});

// ✅ Edit (POST)
router.post('/edit/:id', async (req, res) => {
  const post = await Post.getById(req.params.id);
  if (!post || post.author !== req.session.user.username) {
    return res.status(403).send('Unauthorized');
  }
  const { title, content } = req.body;
  await Post.update({ id: req.params.id, title, content });
  res.redirect('/blog/dashboard');
});

module.exports = router;
