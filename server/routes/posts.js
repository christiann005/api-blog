const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authRequired } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

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

    const where = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { author: { select: { id: true, name: true } } },
      }),
    ]);

    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));

    const shaped = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      author: p.author?.name || 'Unknown',
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      author_id: p.author?.id,
    }));

    return res.json(shaped);
  } catch (err) {
    console.error('List posts error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Public: get one post
router.get('/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    return res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author?.name || 'Unknown',
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      author_id: post.author?.id,
    });
  } catch (err) {
    console.error('Get post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Protected: create post (author = current user)
router.post('/', authRequired, validateBody(postUpsertSchema), async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: Number.parseInt(req.user.id, 10),
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return res.status(201).json({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author?.name || 'Unknown',
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      author_id: post.author?.id,
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Protected: update post (owner or admin)
router.put('/:id', authRequired, validateBody(postUpsertSchema), async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const { title, content } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.authorId === Number.parseInt(req.user.id, 10);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.post.update({
      where: { id },
      data: { title, content },
      include: { author: { select: { id: true, name: true } } },
    });

    return res.json({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      author: updated.author?.name || 'Unknown',
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      author_id: updated.author?.id,
    });
  } catch (err) {
    console.error('Update post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Protected: delete post (owner or admin)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.authorId === Number.parseInt(req.user.id, 10);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await prisma.post.delete({ where: { id } });
    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
