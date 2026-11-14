const FoodItem = require('../models/FoodItem');
const { calculateRecipeNutrition } = require('../services/recipeCalculator');

// Transliteration alias mapping dictionary for common Tamil/Indian search terms
const TRANSLITERATION_MAP = {
  idly: 'idli',
  dosai: 'dosa',
  dhosai: 'dosa',
  thayir: 'curd',
  saadham: 'rice',
  sadam: 'rice',
  chawal: 'rice',
  murungai: 'keerai',
  sambhar: 'sambar',
  koozh: 'kambu',
  parotta: 'barotta',
  poori: 'puri',
  chappathi: 'roti',
  chapati: 'roti',
};

function buildCategoryFilter(category) {
  if (!category || category === 'all') return null;

  switch (category) {
    case 'south_indian_tiffin':
      return {
        $or: [
          { category: { $in: ['south_indian_tiffin', 'tiffin'] } },
          { tags: { $in: ['tiffin', 'south_indian_tiffin', 'breakfast'] } },
          { canonicalName: { $regex: /idli|dosa|dosai|appam|puttu|upma|uttapam|pongal|akkiroti|paniyaram|meduvada|vada|pesarattu|neerdosa/i } },
          { name: { $regex: /idli|dosa|dosai|appam|puttu|upma|uttapam|pongal|akkiroti|paniyaram|meduvada|vada|pesarattu|neerdosa/i } },
          { displayName: { $regex: /idli|dosa|dosai|appam|puttu|upma|uttapam|pongal|akkiroti|paniyaram|meduvada|vada|pesarattu|neerdosa/i } },
        ]
      };

    case 'tamil_meals':
      return {
        $or: [
          { category: 'tamil_meals' },
          { canonicalName: { $regex: /rice|sambar|rasam|poriyal|kootu|curd|thayir|sadam|saadham|bisibelebath|biryani|meals/i } },
          { name: { $regex: /rice|sambar|rasam|poriyal|kootu|curd|thayir|sadam|saadham|bisibelebath|biryani|meals/i } },
          { displayName: { $regex: /rice|sambar|rasam|poriyal|kootu|curd|thayir|sadam|saadham|bisibelebath|biryani|meals/i } },
        ]
      };

    case 'chutneys_gravies_sides':
    case 'legumes':
      return {
        $or: [
          { category: { $in: ['chutneys_gravies_sides', 'legumes', 'gravies', 'sides'] } },
          { canonicalName: { $regex: /sambar|dal|chutney|gravy|kootu|tadka|curry/i } },
          { name: { $regex: /sambar|dal|chutney|gravy|kootu|tadka|curry/i } },
          { displayName: { $regex: /sambar|dal|chutney|gravy|kootu|tadka|curry/i } },
        ]
      };

    case 'north_indian':
      return {
        $or: [
          { category: 'north_indian' },
          { cuisine: 'north_indian' },
          { canonicalName: { $regex: /naan|roti|chapati|paratha|paneer|chhole|bhature|rajma|pavbhaji|misalpav|litti|thepla|thalipeeth|misiroti|butterchicken|tandoori|aloogobi|baingan|bhindi/i } },
          { name: { $regex: /naan|roti|chapati|paratha|paneer|chhole|bhature|rajma|pavbhaji|misalpav|litti|thepla|thalipeeth|misiroti|butterchicken|tandoori|aloogobi|baingan|bhindi/i } },
          { displayName: { $regex: /naan|roti|chapati|paratha|paneer|chhole|bhature|rajma|pavbhaji|misalpav|litti|thepla|thalipeeth|misiroti|butterchicken|tandoori|aloogobi|baingan|bhindi/i } },
        ]
      };

    case 'rice_and_grains':
    case 'grains':
      return {
        $or: [
          { category: { $in: ['rice_and_grains', 'grains', 'cereals'] } },
          { canonicalName: { $regex: /rice|roti|chapati|naan|thepla|thalipeeth|poha|sabudana|quinoa|oats|khichdi|biryani|puttu|appam|dosa|idli/i } },
          { name: { $regex: /rice|roti|chapati|naan|thepla|thalipeeth|poha|sabudana|quinoa|oats|khichdi|biryani|puttu|appam|dosa|idli/i } },
          { displayName: { $regex: /rice|roti|chapati|naan|thepla|thalipeeth|poha|sabudana|quinoa|oats|khichdi|biryani|puttu|appam|dosa|idli/i } },
        ]
      };

    case 'vegetables_and_greens':
    case 'vegetables':
      return {
        $or: [
          { category: { $in: ['vegetables_and_greens', 'vegetables', 'greens'] } },
          { canonicalName: { $regex: /gobi|baingan|bhindi|aloo|keerai|palak|spinach|drumstick|vegetable|salad/i } },
          { name: { $regex: /gobi|baingan|bhindi|aloo|keerai|palak|spinach|drumstick|vegetable|salad/i } },
          { displayName: { $regex: /gobi|baingan|bhindi|aloo|keerai|palak|spinach|drumstick|vegetable|salad/i } },
        ]
      };

    case 'fruits':
      return {
        $or: [
          { category: 'fruits' },
          { canonicalName: { $regex: /apple|banana|mango|orange|guava|papaya|pomegranate|fruit/i } },
          { name: { $regex: /apple|banana|mango|orange|guava|papaya|pomegranate|fruit/i } },
          { displayName: { $regex: /apple|banana|mango|orange|guava|papaya|pomegranate|fruit/i } },
        ]
      };

    case 'protein_foods':
    case 'protein':
      return {
        $or: [
          { category: { $in: ['protein_foods', 'protein'] } },
          { canonicalName: { $regex: /egg|chicken|fish|mutton|paneer|tofu|soya|moong|chila|protein|haleem/i } },
          { name: { $regex: /egg|chicken|fish|mutton|paneer|tofu|soya|moong|chila|protein|haleem/i } },
          { displayName: { $regex: /egg|chicken|fish|mutton|paneer|tofu|soya|moong|chila|protein|haleem/i } },
        ]
      };

    case 'dairy_and_alternatives':
    case 'dairy':
      return {
        $or: [
          { category: { $in: ['dairy_and_alternatives', 'dairy'] } },
          { canonicalName: { $regex: /yogurt|curd|paneer|milk|cheese|buttermilk|lassi|ghee/i } },
          { name: { $regex: /yogurt|curd|paneer|milk|cheese|buttermilk|lassi|ghee/i } },
          { displayName: { $regex: /yogurt|curd|paneer|milk|cheese|buttermilk|lassi|ghee/i } },
        ]
      };

    case 'snacks_and_street_foods':
    case 'snacks':
      return {
        $or: [
          { category: { $in: ['snacks_and_street_foods', 'snacks'] } },
          { canonicalName: { $regex: /samosa|kachori|bhelpuri|panipuri|golgappa|vadapav|dhokla|khandvi|mathri|alootikki|bhujia|sev|chakli|murukku|chana|makhana|chikki|paniyaram|pavbhaji/i } },
          { name: { $regex: /samosa|kachori|bhelpuri|panipuri|golgappa|vadapav|dhokla|khandvi|mathri|alootikki|bhujia|sev|chakli|murukku|chana|makhana|chikki|paniyaram|pavbhaji/i } },
          { displayName: { $regex: /samosa|kachori|bhelpuri|panipuri|golgappa|vadapav|dhokla|khandvi|mathri|alootikki|bhujia|sev|chakli|murukku|chana|makhana|chikki|paniyaram|pavbhaji/i } },
        ]
      };

    case 'sweets_and_desserts':
    case 'sweets':
      return {
        $or: [
          { category: { $in: ['sweets_and_desserts', 'sweets', 'desserts'] } },
          { canonicalName: { $regex: /halwa|gulabjamun|rasgulla|jalebi|kajukatli|payasam|kheer|mysorepak|sweet|laddoo|pedha/i } },
          { name: { $regex: /halwa|gulabjamun|rasgulla|jalebi|kajukatli|payasam|kheer|mysorepak|sweet|laddoo|pedha/i } },
          { displayName: { $regex: /halwa|gulabjamun|rasgulla|jalebi|kajukatli|payasam|kheer|mysorepak|sweet|laddoo|pedha/i } },
        ]
      };

    case 'drinks':
    case 'beverages':
      return {
        $or: [
          { category: { $in: ['drinks', 'beverages'] } },
          { canonicalName: { $regex: /tea|chai|coffee|lassi|juice|buttermilk|water|drink/i } },
          { name: { $regex: /tea|chai|coffee|lassi|juice|buttermilk|water|drink/i } },
          { displayName: { $regex: /tea|chai|coffee|lassi|juice|buttermilk|water|drink/i } },
        ]
      };

    default:
      return {
        $or: [
          { category: category },
          { tags: category }
        ]
      };
  }
}

async function searchFoods(req, res, next) {
  try {
    const searchParam = req.query.q || req.query.search || '';
    const { category, cuisine, isVegetarian, isVegan, isGlutenFree, page = 1, limit = 200 } = req.query;
    
    const andConditions = [];

    // 1. Text Search with Transliteration & Regional expansions
    if (searchParam && searchParam.trim().length > 0) {
      const term = searchParam.trim().toLowerCase();
      const expandedTerm = TRANSLITERATION_MAP[term] || term;
      const regexPattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const expandedRegexPattern = new RegExp(expandedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      andConditions.push({
        $or: [
          { canonicalName: regexPattern },
          { displayName: regexPattern },
          { name: regexPattern },
          { transliterations: regexPattern },
          { alternateNames: regexPattern },
          { 'regionalNames.ta': regexPattern },
          { tags: regexPattern },
          { canonicalName: expandedRegexPattern },
          { transliterations: expandedRegexPattern },
          { alternateNames: expandedRegexPattern },
          { name: expandedRegexPattern },
          { displayName: expandedRegexPattern }
        ]
      });
    }

    // 2. Category Filter Mapping
    const categoryFilter = buildCategoryFilter(category);
    if (categoryFilter) {
      andConditions.push(categoryFilter);
    }

    // 3. Cuisine Filter
    if (cuisine) {
      andConditions.push({ cuisine });
    }

    // 4. Dietary Flags
    if (isVegetarian === 'true') {
      andConditions.push({
        $and: [
          { 'dietaryFlags.isVegetarian': { $ne: false } },
          { canonicalName: { $not: /chicken|mutton|fish|egg|haleem|meat|prawn|seafood/i } },
          { name: { $not: /chicken|mutton|fish|egg|haleem|meat|prawn|seafood/i } }
        ]
      });
    }
    if (isVegan === 'true') {
      andConditions.push({
        $and: [
          { 'dietaryFlags.isVegan': true },
          { canonicalName: { $not: /curd|yogurt|paneer|milk|ghee|butter|cheese|egg|chicken|mutton|fish/i } }
        ]
      });
    }
    if (isGlutenFree === 'true') {
      andConditions.push({
        $or: [
          { 'dietaryFlags.isGlutenFree': true },
          { canonicalName: { $not: /roti|chapati|naan|wheat|maida|bhature|paratha|sooji|semolina|upma/i } }
        ]
      });
    }

    const mongoQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [foods, total] = await Promise.all([
      FoodItem.find(mongoQuery)
        .sort({ displayName: 1, canonicalName: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FoodItem.countDocuments(mongoQuery),
    ]);

    // Map backward compatible fields for clients expecting simple `calories` or `serving` strings
    const mappedFoods = foods.map(food => {
      const defaultServing = food.servingOptions?.find(s => s.isDefault) || food.servingOptions?.[0] || {
        name: 'Gram',
        weightGrams: food.servingWeightGrams || food.servingSize || 100,
        description: `${food.servingWeightGrams || food.servingSize || 100}g`
      };

      const calories = (food.caloriesKcal !== null && food.caloriesKcal !== undefined)
        ? food.caloriesKcal
        : (food.nutritionPer100g?.calories ?? food.nutrition?.calories ?? 0);

      const protein = (food.proteinG !== null && food.proteinG !== undefined)
        ? food.proteinG
        : (food.nutritionPer100g?.protein ?? food.nutrition?.protein ?? 0);

      const carbs = (food.carbohydratesG !== null && food.carbohydratesG !== undefined)
        ? food.carbohydratesG
        : (food.nutritionPer100g?.carbs ?? food.nutrition?.carbs ?? 0);

      const fat = (food.totalFatG !== null && food.totalFatG !== undefined)
        ? food.totalFatG
        : (food.nutritionPer100g?.fat ?? food.nutrition?.fat ?? 0);

      const fiber = (food.fiberG !== null && food.fiberG !== undefined)
        ? food.fiberG
        : (food.nutritionPer100g?.fiber ?? food.nutrition?.fiber ?? 0);

      return {
        ...food,
        id: food._id.toString(),
        name: food.displayName || food.canonicalName || food.name,
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        fiber: Math.round(fiber * 10) / 10,
        caloriesKcal: Math.round(calories),
        proteinG: Math.round(protein * 10) / 10,
        carbohydratesG: Math.round(carbs * 10) / 10,
        totalFatG: Math.round(fat * 10) / 10,
        fiberG: Math.round(fiber * 10) / 10,
        serving: defaultServing.description || `${defaultServing.weightGrams}g`,
        servingSize: defaultServing.weightGrams,
        servingUnit: defaultServing.name,
        isIndian: food.cuisine === 'south_indian' || food.cuisine === 'tamil_nadu' || food.cuisine === 'north_indian' || food.cuisine === 'indian'
      };
    });


    res.json({
      success: true,
      data: mappedFoods,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        pages: Math.ceil(total / parseInt(limit)) 
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getFoodById(req, res, next) {
  try {
    const food = await FoodItem.findById(req.params.id).lean();
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
}

async function createCustomFood(req, res, next) {
  try {
    const { name, category, servingSize = 100, servingUnit = 'g', nutrition = {}, alternateNames = [], dietaryFlags = {} } = req.body;
    
    const calories = parseFloat(nutrition.calories) || 0;
    const protein = parseFloat(nutrition.protein) || 0;
    const carbs = parseFloat(nutrition.carbs) || 0;
    const fat = parseFloat(nutrition.fat) || 0;
    const fiber = parseFloat(nutrition.fiber) || 0;

    const factor = 100 / servingSize;
    const caloriesKcal = Math.round(calories * factor);
    const proteinG = Math.round(protein * factor * 10) / 10;
    const carbohydratesG = Math.round(carbs * factor * 10) / 10;
    const totalFatG = Math.round(fat * factor * 10) / 10;
    const fiberG = Math.round(fiber * factor * 10) / 10;

    const food = await FoodItem.create({
      foodId: `CUSTOM-${Date.now()}`,
      canonicalName: name,
      displayName: name,
      name,
      category: category || 'homemade_and_recipes',
      cuisine: 'other',
      servingSize,
      servingUnit,
      servingWeightGrams: servingSize,
      caloriesKcal,
      proteinG,
      carbohydratesG,
      totalFatG,
      fiberG,
      verificationStatus: 'user_created',
      isVerified: false,
      isCustom: true,
      createdBy: req.user?.uid || 'anonymous',
      alternateNames,
      dietaryFlags,
      servingOptions: [
        { name: servingUnit === 'g' ? 'Gram' : servingUnit, weightGrams: servingSize, description: `${servingSize}${servingUnit}`, isDefault: true }
      ]
    });

    res.status(201).json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
}

async function calculateRecipe(req, res, next) {
  try {
    const { ingredients, totalCookedWeightGrams, numberOfServings = 1 } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, message: 'Ingredients list is required' });
    }

    // Fetch food items for each ingredient ID
    const enrichedIngredients = await Promise.all(ingredients.map(async (ing) => {
      const foodItem = await FoodItem.findById(ing.foodItemId).lean();
      return { foodItem, weightGrams: ing.weightGrams };
    }));

    const recipeNutrition = calculateRecipeNutrition(enrichedIngredients, totalCookedWeightGrams, numberOfServings);
    res.json({ success: true, data: recipeNutrition });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchFoods, getFoodById, createCustomFood, calculateRecipe };

