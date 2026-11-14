const Recipe = require('../models/Recipe');

exports.getRecipes = async (req, res, next) => {
  try {
    const { category, search, tag } = req.query;
    let query = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const recipes = await Recipe.find(query).limit(50);
    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    next(error);
  }
};

exports.getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    res.json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
};
