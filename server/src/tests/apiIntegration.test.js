const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = require('../app');
const User = require('../models/User');

const TEST_TOKEN = 'dev-token-dev-user-uid-12345';
const TEST_UID = 'dev-user-uid-12345';

jest.setTimeout(30000);

describe('Server API Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthfit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }
    // Ensure test user exists
    await User.findOneAndUpdate(
      { firebaseUid: TEST_UID },
      {
        $set: {
          name: 'Dhina',
          email: 'dhina@fitly.app',
          currentWeight: 72.5,
          targetWeight: 68.0,
          calorieTarget: 2200,
        }
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('GET /api/auth/profile returns user profile with name Dhina', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Dhina');
    expect(res.body.data.email).toBe('dhina@fitly.app');
  });

  test('PUT /api/auth/profile updates profile photo and target weight', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({
        targetWeight: 67.5,
        profilePhoto: 'data:image/jpeg;base64,mockphoto123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.targetWeight).toBe(67.5);
    expect(res.body.data.profilePhoto).toBe('data:image/jpeg;base64,mockphoto123');
  });

  test('GET /api/analytics/dashboard returns calculated metrics', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard?date=2026-10-12')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('calories');
    expect(res.body.data).toHaveProperty('macros');
    expect(res.body.data).toHaveProperty('water');
  });

  test('GET /api/workouts returns list of exercises & routines', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/water logs water intake volume', async () => {
    const res = await request(app)
      .post('/api/water')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ amount: 250, amountMl: 250, date: '2026-10-12' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/weight logs weight entries and updates user current weight', async () => {
    const res = await request(app)
      .post('/api/weight')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ weight: 71.8, weightKg: 71.8, date: '2026-10-12' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify lifetime weights query
    const lifetimeRes = await request(app)
      .get('/api/weight?range=lifetime')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);

    expect(lifetimeRes.status).toBe(200);
    expect(Array.isArray(lifetimeRes.body.data)).toBe(true);
  });

  test('GET /api/fasting/status returns fasting tracker state', async () => {
    const res = await request(app)
      .get('/api/fasting/status')
      .set('Authorization', `Bearer ${TEST_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('isFasting');
  });
});
