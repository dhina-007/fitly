const { calculateNutritionForWeight } = require('./nutritionCalculator');

/**
 * Calculates overall recipe nutrition from a list of ingredient items and total cooked yield.
 * @param {Array<{ foodItem: Object, weightGrams: Number }>} ingredients 
 * @param {Number} totalCookedWeightGrams Optional total cooked weight (accounting for moisture loss/gain)
 * @param {Number} numberOfServings Number of servings yielded by recipe
 */
function calculateRecipeNutrition(ingredients = [], totalCookedWeightGrams = null, numberOfServings = 1) {
  let totalRawWeight = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSodium = 0;

  ingredients.forEach(item => {
    if (!item.foodItem || !item.weightGrams) return;

    totalRawWeight += item.weightGrams;
    const nutrition = calculateNutritionForWeight(item.foodItem, item.weightGrams, 1);

    totalCalories += nutrition.calories || 0;
    totalProtein += nutrition.protein || 0;
    totalCarbs += nutrition.carbs || 0;
    totalFat += nutrition.fat || 0;
    totalFiber += nutrition.fiber || 0;
    if (nutrition.sodium !== null) totalSodium += nutrition.sodium;
  });

  const finalYieldWeight = totalCookedWeightGrams || totalRawWeight || 100;
  const perServingWeight = Math.round(finalYieldWeight / (numberOfServings || 1));

  // Per 100g calculated from final cooked yield
  const factor100 = 100 / finalYieldWeight;

  const nutritionPer100g = {
    calories: Math.round(totalCalories * factor100),
    protein: Math.round(totalProtein * factor100 * 10) / 10,
    carbs: Math.round(totalCarbs * factor100 * 10) / 10,
    fat: Math.round(totalFat * factor100 * 10) / 10,
    fiber: Math.round(totalFiber * factor100 * 10) / 10,
    sodium: Math.round(totalSodium * factor100),
  };

  const perServing = {
    calories: Math.round(totalCalories / numberOfServings),
    protein: Math.round((totalProtein / numberOfServings) * 10) / 10,
    carbs: Math.round((totalCarbs / numberOfServings) * 10) / 10,
    fat: Math.round((totalFat / numberOfServings) * 10) / 10,
    fiber: Math.round((totalFiber / numberOfServings) * 10) / 10,
    sodium: Math.round(totalSodium / numberOfServings),
    servingWeightGrams: perServingWeight,
  };

  return {
    totalRawWeightGrams: Math.round(totalRawWeight),
    totalCookedWeightGrams: Math.round(finalYieldWeight),
    numberOfServings,
    perServing,
    nutritionPer100g,
    totalRecipeNutrition: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
    }
  };
}

module.exports = {
  calculateRecipeNutrition,
};
