const prisma = require('./lib/prisma');
require('dotenv').config();

const { createApp } = require('./app');
const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  // Verify database connection
  await prisma.$connect();
  console.log('Database connected successfully');

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
