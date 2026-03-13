const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { createApp } = require('../app');
const User = require('../models/User');

jest.setTimeout(120000);

let mongo;
let app;

async function registerAndGetToken(email, name = 'User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' })
    .expect(201);
  return res.body.token;
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  process.env.CORS_ORIGIN = 'http://localhost:5173';

  // Avoid concurrent downloads and flaky cache behavior by pinning a local download dir.
  process.env.MONGOMS_DOWNLOAD_DIR = path.join(__dirname, '..', '.mongo-binaries');

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Auth', () => {
  test('register -> me', async () => {
    const token = await registerAndGetToken('alice@example.com', 'Alice');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.user.email).toBe('alice@example.com');
  });

  test('login with wrong password fails', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'nope' })
      .expect(401);
  });
});

describe('Posts', () => {
  test('create/list/search/paginate', async () => {
    const token = await registerAndGetToken('p1@example.com');

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hello World', content: 'First post' })
      .expect(201);

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Another', content: 'Second post content' })
      .expect(201);

    const list = await request(app).get('/api/posts?limit=1&page=1').expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBe(1);
    expect(list.headers).toHaveProperty('x-total-count');

    const search = await request(app).get('/api/posts?q=hello').expect(200);
    expect(search.body.some((p) => p.title === 'Hello World')).toBe(true);
  });

  test('only owner can delete; admin can delete', async () => {
    const ownerToken = await registerAndGetToken('owner@example.com');
    let otherToken = await registerAndGetToken('other@example.com');

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'To Delete', content: 'x' })
      .expect(201);

    await request(app)
      .delete(`/api/posts/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await User.updateOne({ email: 'other@example.com' }, { $set: { role: 'admin' } });
    // Role is embedded into the JWT at sign time, so we need a new token after promotion.
    const relog = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'secret123' })
      .expect(200);
    otherToken = relog.body.token;

    await request(app)
      .delete(`/api/posts/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
  });
});
