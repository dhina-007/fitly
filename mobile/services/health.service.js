import api from './api';
import { POPULAR_INDIAN_FOODS } from '../data/fallbackFoods';

export const healthService = {
  // 1. Dashboard Analytics
  getDashboardAnalytics: async (date) => {
    try {
      const d = typeof date === 'string' && date ? date : new Date().toISOString().split('T')[0];
      const res = await api.get(`/analytics/dashboard?date=${d}`);
      return res.data?.data;
    } catch (err) {
      console.warn('API getDashboardAnalytics fallback:', err.message);
      return null;
    }
  },

  // 2. Food Database & Logs
  getFoods: async (search = '', category = '', isVegetarian = false) => {
    try {
      let url = `/foods?search=${encodeURIComponent(search)}&limit=500`;
      if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
      if (isVegetarian) url += `&isVegetarian=true`;
      
      const res = await api.get(url);
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error('Fallback to local database');
    } catch (err) {
      // Rich local fallback with 291+ Indian & fitness foods
      let list = POPULAR_INDIAN_FOODS;
      if (isVegetarian) {
        list = list.filter((f) => f.isVegetarian);
      }
      if (category && category !== 'all') {
        const catMap = {
          south_indian_tiffin: ['south_indian_tiffin', 'tiffin', 'breakfast'],
          protein_foods: ['protein_foods', 'protein', 'meat', 'egg', 'paneer'],
          rice_and_grains: ['rice_and_grains', 'grains', 'rice'],
          chutneys_gravies_sides: ['chutneys_gravies_sides', 'legumes', 'gravies', 'sides'],
          vegetables_and_greens: ['vegetables_and_greens', 'vegetables', 'greens'],
          dairy_and_alternatives: ['dairy_and_alternatives', 'dairy'],
          snacks_and_street_foods: ['snacks_and_street_foods', 'snacks', 'chaat'],
          sweets_and_desserts: ['sweets_and_desserts', 'sweets', 'desserts'],
          north_indian: ['north_indian'],
          tamil_meals: ['tamil_meals', 'meals'],
          drinks: ['drinks', 'beverages'],
        };
        const allowed = catMap[category] || [category];
        list = list.filter((f) => {
          const c = (f.category || '').toLowerCase();
          return allowed.some((a) => c.includes(a)) || allowed.includes(c);
        });
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (f) =>
            (f.canonicalName && f.canonicalName.toLowerCase().includes(q)) ||
            (f.displayName && f.displayName.toLowerCase().includes(q)) ||
            (f.name && f.name.toLowerCase().includes(q)) ||
            (f.nameTa && f.nameTa.toLowerCase().includes(q))
        );
      }
      return list;
    }
  },


  getFoodLogs: async (date) => {
    try {
      const d = typeof date === 'string' && date ? date : new Date().toISOString().split('T')[0];
      const res = await api.get(`/food-logs/${d}`);
      const data = res.data?.data;
      if (data && Array.isArray(data.logs)) return data.logs;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.warn('API getFoodLogs fallback:', err.message);
      return [];
    }
  },

  logFoodItem: async (foodLogData) => {
    const res = await api.post('/food-logs', foodLogData);
    return res.data;
  },

  deleteFoodEntry: async (logId, entryId) => {
    const res = await api.delete(`/food-logs/${logId}/entries/${entryId}`);
    return res.data;
  },

  // 3. Recipes
  getRecipes: async (category = '', tag = '') => {
    try {
      const res = await api.get(`/recipes?category=${category}&tag=${tag}`);
      return res.data?.data || [];
    } catch (err) {
      console.warn('API getRecipes fallback:', err.message);
      return [];
    }
  },

  // 4. Exercises & Workouts
  getExercises: async (search = '') => {
    try {
      const res = await api.get(`/exercises?search=${encodeURIComponent(search)}`);
      return res.data?.data || [];
    } catch (err) {
      console.warn('API getExercises fallback:', err.message);
      return [];
    }
  },

  getWorkouts: async () => {
    try {
      const res = await api.get('/workouts');
      return res.data?.data || [];
    } catch (err) {
      console.warn('API getWorkouts fallback:', err.message);
      return [];
    }
  },

  // 5. Fasting
  getFastingStatus: async () => {
    try {
      const res = await api.get('/fasting/status');
      return res.data?.data;
    } catch (err) {
      console.warn('API getFastingStatus fallback:', err.message);
      return null;
    }
  },

  startFast: async (targetHours = 16, protocol = '16:8') => {
    try {
      const res = await api.post('/fasting/start', { targetHours, protocol });
      return res.data?.data;
    } catch (err) {
      console.warn('API startFast fallback:', err.message);
      return null;
    }
  },

  endFast: async () => {
    try {
      const res = await api.post('/fasting/end');
      return res.data?.data;
    } catch (err) {
      console.warn('API endFast fallback:', err.message);
      return null;
    }
  },

  // 6. Ria AI Health Coach
  chatWithRia: async (message, date) => {
    const res = await api.post('/ai/chat', { message, date });
    return res.data?.data;
  },
  getAIHistory: async () => {
    try {
      const res = await api.get('/ai/history');
      return res.data?.data;
    } catch (err) {
      console.warn('getAIHistory fallback:', err.message);
      return null;
    }
  },
  clearAIHistory: async () => {
    try {
      const res = await api.delete('/ai/history');
      return res.data;
    } catch (err) {
      console.warn('clearAIHistory fallback:', err.message);
      return null;
    }
  },

  // 7. Water, Sleep, Weight & Activity Logs
  logWater: async (amountMl, date) => {
    const d = date || new Date().toISOString().split('T')[0];
    const res = await api.post('/water', { amount: amountMl, amountMl, date: d });
    return res.data;
  },

  logSleep: async (hours, quality = 'Good', date) => {
    const d = date || new Date().toISOString().split('T')[0];
    const res = await api.post('/sleep', { hours, quality, date: d });
    return res.data;
  },

  logWeight: async (weightKg, date, base64Image) => {
    try {
      const d = date || new Date().toISOString().split('T')[0];
      const parsedWeight = parseFloat(weightKg);
      const res = await api.post('/weight', { weight: parsedWeight, weightKg: parsedWeight, date: d, base64Image });
      return res.data;
    } catch (err) {
      console.warn('logWeight API fallback:', err.message);
      return null;
    }
  },

  logActivity: async (steps, caloriesBurned, date) => {
    try {
      const d = typeof date === 'string' && date ? date : new Date().toISOString().split('T')[0];
      const cal = parseInt(caloriesBurned, 10) || 0;
      const res = await api.post('/activity', {
        steps: parseInt(steps, 10) || 0,
        activeCalories: cal,
        caloriesBurned: cal,
        date: d,
      });
      return res.data;
    } catch (err) {
      console.warn('logActivity API fallback:', err.message);
      return null;
    }
  },

  logWorkout: async (workoutData) => {
    try {
      const res = await api.post('/workouts/logs', workoutData);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('logWorkout API fallback:', err.message);
      return null;
    }
  },

  getWorkouts: async (params = {}) => {
    try {
      const res = await api.get('/workouts', { params });
      return res.data?.data || [];
    } catch (err) {
      console.warn('getWorkouts API fallback:', err.message);
      return [];
    }
  },

  getWorkoutById: async (id) => {
    try {
      const res = await api.get(`/workouts/${id}`);
      return res.data?.data;
    } catch (err) {
      console.warn('getWorkoutById API fallback:', err.message);
      return null;
    }
  },

  getWorkoutRecommendation: async () => {
    try {
      const res = await api.get('/workouts/recommendation');
      return res.data?.data;
    } catch (err) {
      console.warn('getWorkoutRecommendation API fallback:', err.message);
      return null;
    }
  },

  getWorkoutLogs: async (range = '30d') => {
    try {
      const res = await api.get(`/workouts/logs?range=${range}`);
      return res.data || { data: [], weeklyStats: {} };
    } catch (err) {
      console.warn('getWorkoutLogs API fallback:', err.message);
      return { data: [], weeklyStats: {} };
    }
  },

  getExerciseSubstitutions: async (params = {}) => {
    try {
      const res = await api.get('/workouts/substitutions', { params });
      return res.data?.data || [];
    } catch (err) {
      console.warn('getExerciseSubstitutions API fallback:', err.message);
      return [];
    }
  },

  // 8. Habits
  getHabits: async (date) => {
    const d = date || new Date().toISOString().split('T')[0];
    const res = await api.get(`/habits?date=${d}`);
    return res.data?.data || [];
  },
  createHabit: async (habitData) => {
    const res = await api.post('/habits', habitData);
    return res.data?.data;
  },
  updateHabit: async (habitId, habitData) => {
    const res = await api.put(`/habits/${habitId}`, habitData);
    return res.data?.data;
  },
  toggleHabit: async (habitId, date) => {
    const res = await api.post(`/habits/${habitId}/toggle`, { date });
    return res.data?.data;
  },
  deleteHabit: async (habitId) => {
    const res = await api.delete(`/habits/${habitId}`);
    return res.data;
  },

  // 9. Community & Admin Feed
  getFeedPosts: async () => {
    const res = await api.get('/community/feed');
    return res.data || { data: [], feedJoined: false, isAdmin: false };
  },
  createFeedPost: async (postData) => {
    const res = await api.post('/community/feed', postData);
    return res.data?.data;
  },
  deleteFeedPost: async (postId) => {
    const res = await api.delete(`/community/feed/${postId}`);
    return res.data;
  },
  toggleSubscribeFeed: async () => {
    const res = await api.post('/community/feed/subscribe');
    return res.data;
  },
  toggleLikeFeedPost: async (postId) => {
    const res = await api.post(`/community/feed/${postId}/like`);
    return res.data?.data;
  },
  toggleJoinFeedPost: async (postId) => {
    const res = await api.post(`/community/feed/${postId}/join`);
    return res.data?.data;
  },
  getCommunities: async () => {
    const res = await api.get('/community/communities');
    return res.data || { data: [], isAdmin: false };
  },
  createCommunity: async (communityData) => {
    const res = await api.post('/community/communities', communityData);
    return res.data?.data;
  },
  deleteCommunity: async (communityId) => {
    const res = await api.delete(`/community/communities/${communityId}`);
    return res.data;
  },
  joinCommunity: async (communityId) => {
    const res = await api.post(`/community/communities/${communityId}/join`);
    return res.data;
  },
  leaveCommunity: async (communityId) => {
    const res = await api.post(`/community/communities/${communityId}/leave`);
    return res.data;
  },
};

