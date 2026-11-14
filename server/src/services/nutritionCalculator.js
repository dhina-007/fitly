/**
 * Utility functions for converting food serving sizes and calculating nutrition.
 */

/**
 * Calculates nutritional values for a food item given a target weight in grams and quantity.
 * Safe handling of null values (unverified nutrients stay null).
 */
function calculateNutritionForWeight(foodItem, weightGrams, quantity = 1) {
  if (!foodItem) return null;

  const totalGrams = weightGrams * quantity;
  const factor = totalGrams / 100;

  const calculateNutrient = (per100gVal) => {
    if (per100gVal === null || per100gVal === undefined) return null;
    return Math.round(per100gVal * factor * 10) / 10;
  };

  // Base per 100g source (either precise fields or nutritionPer100g object)
  const caloriesPer100g = foodItem.caloriesKcal ?? foodItem.nutritionPer100g?.calories ?? null;
  const proteinPer100g = foodItem.proteinG ?? foodItem.nutritionPer100g?.protein ?? null;
  const carbsPer100g = foodItem.carbohydratesG ?? foodItem.nutritionPer100g?.carbs ?? null;
  const fatPer100g = foodItem.totalFatG ?? foodItem.nutritionPer100g?.fat ?? null;
  const fiberPer100g = foodItem.fiberG ?? foodItem.nutritionPer100g?.fiber ?? null;
  const sugarPer100g = foodItem.sugarG ?? foodItem.nutritionPer100g?.sugar ?? null;
  const sodiumPer100g = foodItem.sodiumMg ?? foodItem.nutritionPer100g?.sodium ?? null;
  const satFatPer100g = foodItem.saturatedFatG ?? foodItem.nutritionPer100g?.saturatedFat ?? null;

  const calories = caloriesPer100g !== null ? Math.round(caloriesPer100g * factor) : 0;
  const protein = calculateNutrient(proteinPer100g) ?? 0;
  const carbs = calculateNutrient(carbsPer100g) ?? 0;
  const fat = calculateNutrient(fatPer100g) ?? 0;
  const fiber = calculateNutrient(fiberPer100g) ?? 0;
  const sugar = calculateNutrient(sugarPer100g);
  const sodium = calculateNutrient(sodiumPer100g);
  const saturatedFat = calculateNutrient(satFatPer100g);

  return {
    totalWeightGrams: Math.round(totalGrams),
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    saturatedFat,
    // Per 100g breakdown for reference
    per100g: {
      calories: caloriesPer100g,
      protein: proteinPer100g,
      carbs: carbsPer100g,
      fat: fatPer100g,
      fiber: fiberPer100g,
      sugar: sugarPer100g,
      sodium: sodiumPer100g,
      saturatedFat: satFatPer100g,
    }
  };
}

/**
 * Calculates nutrition for a specific named serving option (e.g., 'Piece', 'Katori', 'Bowl').
 */
function calculateNutritionForServingOption(foodItem, optionName, quantity = 1) {
  let serving = foodItem.servingOptions?.find(s => s.name.toLowerCase() === optionName.toLowerCase());
  
  if (!serving) {
    // Default fallback to first serving option or 100g standard
    serving = foodItem.servingOptions?.[0] || { weightGrams: foodItem.servingWeightGrams || 100, name: 'Serving' };
  }

  const result = calculateNutritionForWeight(foodItem, serving.weightGrams, quantity);
  return {
    ...result,
    servingName: serving.name,
    weightPerServingGrams: serving.weightGrams,
    quantity,
  };
}

module.exports = {
  calculateNutritionForWeight,
  calculateNutritionForServingOption,
};
