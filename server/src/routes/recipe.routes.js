const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, recipeController.getRecipes);
router.get('/:id', protect, recipeController.getRecipeById);

module.exports = router;
