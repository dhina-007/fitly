const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `fitly_usr_${new mongoose.Types.ObjectId()}`,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  profilePhoto: { type: String, default: null },
  dateOfBirth: { type: Date },
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  height: { type: Number, min: 50, max: 300 }, // cm
  currentWeight: { type: Number, min: 10, max: 500 }, // kg
  targetWeight: { type: Number, min: 10, max: 500 }, // kg
  activityLevel: { type: String, enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'] },
  fitnessGoal: { type: String, enum: ['weight_loss', 'weight_gain', 'muscle_building', 'maintenance', 'general_fitness', 'better_nutrition', 'better_sleep', 'improved_activity'] },
  dietaryPreference: { type: String, enum: ['non_vegetarian', 'vegetarian', 'vegan', 'eggetarian', 'jain', 'custom'] },
  allergies: [{ type: String }],
  preferredCuisine: [{ type: String }],
  dislikedFoods: [{ type: String }],
  likedFoods: [{ type: String }],
  // Calculated targets
  calorieTarget: { type: Number, default: 2000 },
  proteinTarget: { type: Number, default: 100 }, // grams
  carbTarget: { type: Number, default: 250 },
  fatTarget: { type: Number, default: 65 },
  fiberTarget: { type: Number, default: 30 },
  waterTarget: { type: Number, default: 2500 }, // ml
  stepTarget: { type: Number, default: 8000 },
  sleepTarget: { type: Number, default: 8 }, // hours
  // Calculated metrics
  bmi: { type: Number },
  bmr: { type: Number },
  tdee: { type: Number },
  predictedTdee: { type: Number },
  isCustomMaintenance: { type: Boolean, default: false },
  // Settings
  timezone: { type: String, default: 'Asia/Kolkata' },
  units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
  onboardingCompleted: { type: Boolean, default: false },
  // Notification preferences
  notificationPrefs: {
    mealReminders: { type: Boolean, default: true },
    waterReminders: { type: Boolean, default: true },
    workoutReminders: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },
  },
  expoPushToken: { type: String },
  // Admin
  isAdmin: { type: Boolean, default: false },
  // Community & Feed membership
  feedJoined: { type: Boolean, default: false },
  // Fasting Tracker
  fasting: {
    isFasting: { type: Boolean, default: false },
    startTime: { type: Date, default: null },
    targetHours: { type: Number, default: 16 },
    protocol: { type: String, default: '16:8' },
  },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
