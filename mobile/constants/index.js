import { Colors } from './colors.js';
import { Typography } from './typography.js';

export { Colors, Typography };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];
export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise', multiplier: 1.2 },
  { id: 'lightly_active', label: 'Lightly Active', description: '1-3 days/week', multiplier: 1.375 },
  { id: 'moderately_active', label: 'Moderately Active', description: '3-5 days/week', multiplier: 1.55 },
  { id: 'very_active', label: 'Very Active', description: '6-7 days/week', multiplier: 1.725 },
  { id: 'extra_active', label: 'Extra Active', description: 'Very hard exercise, physical job', multiplier: 1.9 },
];
export const FITNESS_GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '🏃', description: 'Lose body fat and get leaner' },
  { id: 'weight_gain', label: 'Weight Gain', icon: '💪', description: 'Gain mass and strength' },
  { id: 'muscle_building', label: 'Muscle Building', icon: '🏋️', description: 'Build lean muscle mass' },
  { id: 'maintenance', label: 'Maintenance', icon: '⚖️', description: 'Maintain current weight' },
  { id: 'general_fitness', label: 'General Fitness', icon: '🌟', description: 'Improve overall fitness' },
  { id: 'better_nutrition', label: 'Better Nutrition', icon: '🥗', description: 'Eat healthier every day' },
  { id: 'better_sleep', label: 'Better Sleep', icon: '😴', description: 'Improve sleep quality' },
  { id: 'improved_activity', label: 'Improved Activity', icon: '🚶', description: 'Move more daily' },
];
export const DIETARY_PREFERENCES = [
  { id: 'non_vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'jain', label: 'Jain', icon: '🙏' },
  { id: 'custom', label: 'Custom', icon: '⚙️' },
];
export const WATER_QUICK_ADD = [250, 500, 750, 1000];

export default { Colors, Typography, Spacing, BorderRadius, Shadows };