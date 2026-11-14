require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging (safe - no health data logged)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));
}

// 100% Public Health checks (bypasses rate limiters for Render & uptime monitors)
app.use('/health', require('./routes/health.routes'));
app.use('/api/health', require('./routes/health.routes'));

// Rate limiting for protected API routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  message: { success: false, message: 'Too many requests, please try again later' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 500,
  message: { success: false, message: 'AI rate limit exceeded' },
});

app.use('/api', globalLimiter);
app.use('/api/ai', aiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/foods', require('./routes/food.routes'));
app.use('/api/food-logs', require('./routes/foodLog.routes'));
app.use('/api/weight', require('./routes/weight.routes'));
app.use('/api/water', require('./routes/water.routes'));
app.use('/api/sleep', require('./routes/sleep.routes'));
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/habits', require('./routes/habit.routes'));
app.use('/api/workouts', require('./routes/workout.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/fasting', require('./routes/fasting.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/recipes', require('./routes/recipe.routes'));
app.use('/api/exercises', require('./routes/exercise.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/sync', require('./middleware/auth').protect, require('./routes/syncRoutes'));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handling
app.use(errorHandler);

module.exports = app;
