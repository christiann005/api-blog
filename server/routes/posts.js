const express = require('express');
const { z } = require('zod');
const Post = require('../models/Post');
const { authRequired } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const postUpsertSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().min(1).max(50000),
});

// Public: list posts
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limitRaw = Number.parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const filter = {};
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: re }, { content: re }];
    }

    const [total, posts] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name')
      .lean(),
    ]);

    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));

    // Keep response compatible with existing client fields.
    const shaped = posts.map((p) => ({
      id: p._id,
      title: p.title,
      content: p.content,
      author: p.author?.name || 'Unknown',
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      author_id: p.author?._id,
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Public: get one post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name').lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.json({
      id: post._id,
      title: post.title,
      content: post.content,
      author: post.author?.name || 'Unknown',
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      author_id: post.author?._id,
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid id' });
  }
});

// Protected: create post (author = current user)
router.post('/', authRequired, validateBody(postUpsertSchema), async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await Post.create({
      title,
      content,
      author: req.user.id,
    });

    const populated = await Post.findById(post._id).populate('author', 'name').lean();
    return res.status(201).json({
      id: populated._id,
      title: populated.title,
      content: populated.content,
      author: populated.author?.name || 'Unknown',
      created_at: populated.createdAt,
      updated_at: populated.updatedAt,
      author_id: populated.author?._id,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Protected: update post (owner or admin)
router.put('/:id', authRequired, validateBody(postUpsertSchema), async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    post.title = title;
    post.content = content;
    await post.save();

    const populated = await Post.findById(post._id).populate('author', 'name').lean();
    return res.json({
      id: populated._id,
      title: populated.title,
      content: populated.content,
      author: populated.author?.name || 'Unknown',
      created_at: populated.createdAt,
      updated_at: populated.updatedAt,
      author_id: populated.author?._id,
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid id' });
  }
});

// Protected: delete post (owner or admin)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await Post.deleteOne({ _id: post._id });
    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid id' });
  }
});

module.exports = router;
