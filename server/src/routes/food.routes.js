const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { searchFoods, getFoodById, createCustomFood, calculateRecipe } = require('../controllers/food.controller');

router.get('/', requireAuth, searchFoods);
router.get('/:id', requireAuth, getFoodById);
router.post('/', requireAuth, createCustomFood);
router.post('/recipe-nutrition', requireAuth, calculateRecipe);

module.exports = router;

