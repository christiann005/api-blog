const mongoose = require('mongoose');
require('dotenv').config();

const { createApp } = require('./app');
const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
