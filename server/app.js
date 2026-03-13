const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    // Needed when behind a reverse proxy so rate limits use real client IPs.
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/posts', postRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

