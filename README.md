# HealthFit 💚

> Your complete, free health and fitness companion — no paywalls, no subscriptions, all features for every user.

## Overview

HealthFit is a production-ready cross-platform mobile health, fitness, nutrition, and wellness application built with React Native + Expo (mobile), Node.js + Express (backend), MongoDB Atlas (database), and Firebase Authentication.

## Monorepo Structure

```
healthfit/
├── mobile/          ← React Native + Expo app (iOS & Android)
├── server/          ← Node.js + Express REST API
├── admin/           ← Web-based admin dashboard (Next.js)
└── README.md
```

## Features

- 🍽️ **Nutrition Tracking** — Complete food diary with 100+ Indian foods, custom foods, barcode scanning
- 🏋️ **Workout System** — Categorized workouts, active workout tracking, workout history
- 📊 **Progress Analytics** — Weight, steps, sleep, water, habits — all charted over time
- 🤖 **AI Health Coach** — Personalized AI assistant with full user context
- 🔍 **AI Food Scanner** — Camera-based food recognition and nutrition estimation
- 📋 **Meal Planner** — Personalized 1-day and 7-day meal plans
- 💧 **Water Tracking** — Daily water intake with quick-add buttons
- 😴 **Sleep Tracking** — Sleep logs with consistency scoring
- ✅ **Habit Tracking** — Custom habits with streaks and calendars
- 🏃 **Activity** — Step counting with HealthKit/Health Connect integration
- 📈 **Health Score** — Original daily wellness score
- 📬 **Weekly AI Report** — Auto-generated wellness insights every week

## Tech Stack

### Mobile
- React Native + Expo (JavaScript)
- Expo Router (navigation)
- NativeWind (styling)
- React Native Reanimated (animations)
- Zustand (global state)
- TanStack Query (server state)
- Firebase Auth (authentication)
- Lucide React Native (icons)

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- Firebase Admin SDK (token verification)
- OpenAI GPT-4o (AI features)
- Cloudinary (image storage)

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- MongoDB Atlas account
- Firebase project

### Mobile App
```bash
cd mobile
cp .env.example .env
# Fill in your Firebase credentials
npm install
npx expo start
```

### Backend Server
```bash
cd server
cp .env.example .env
# Fill in your credentials
npm install
npm run seed   # Seed Indian food database
npm run dev
```

### Admin Dashboard
```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

See `mobile/.env.example` and `server/.env.example` for required variables.

**Never commit `.env` files.**

## API Documentation

Base URL: `http://localhost:3000/api`

All private endpoints require Firebase ID token:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints
- `GET/PUT /api/auth/profile` — User profile
- `GET /api/foods` — Search foods
- `GET/POST /api/food-logs/:date` — Food diary
- `GET/POST /api/weight` — Weight logs
- `GET/POST /api/water/:date` — Water logs
- `GET/POST /api/sleep` — Sleep logs
- `GET/POST /api/activity/:date` — Activity/steps
- `GET/POST /api/habits` — Habits
- `GET/POST /api/workouts` — Workouts
- `POST /api/ai/chat` — AI health coach
- `POST /api/ai/food-analysis` — AI food scanner
- `POST /api/ai/meal-plan` — Meal planner
- `GET /api/ai/weekly-report` — Weekly wellness report

## Security

- Firebase token verification on every private API endpoint
- User ID always resolved from Firebase token — never from request body
- Rate limiting (300 req/15min global, 10 req/min for AI)
- Helmet security headers
- Input validation with Joi
- No health data in logs or URLs

## Medical Disclaimer

HealthFit is a general wellness and fitness application. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.

## License

MIT — Free for all users. No premium tier. No subscriptions.
