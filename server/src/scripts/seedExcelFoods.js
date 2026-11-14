const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodItem = require('../models/FoodItem');

const CATEGORY_MAP = {
  'Staples & rice': 'rice_and_grains',
  'Dals & legumes': 'legumes',
  'Eggs, meat & fish': 'protein_foods',
  'Dairy & alternatives': 'dairy_and_alternatives',
  Vegetables: 'vegetables_and_greens',
  Fruits: 'fruits',
  'Nuts & seeds': 'nuts',
  'Snacks & sweets': 'snacks_and_street_foods',
  Beverages: 'drinks',
  'Breakfast & tiffin': 'south_indian_tiffin',
  'Rice dishes': 'rice_and_grains',
  'Breads & parathas': 'north_indian',
  'Dals, legumes & curries': 'chutneys_gravies_sides',
  'Egg, meat & fish dishes': 'protein_foods',
  'Dairy & snacks': 'snacks_and_street_foods',
  'Sweets & desserts': 'sweets_and_desserts',
  'Nuts, seeds & pantry': 'nuts',
};

const SWEET_KEYWORDS = /laddu|gulab jamun|mysore pak|jalebi|kesari|payasam|adhirasam|jangiri|badusha|kozhukattai, sweet|puran poli|kaju katli|rasgulla|halwa|burfi|peda|shrikhand/i;
const NON_VEG_KEYWORDS = /\b(egg|eggs|omelette|chicken|mutton|fish|prawns|prawn|sardines|tuna|crab)\b/i;
const DAIRY_KEYWORDS = /\b(milk|curd|yogurt|buttermilk|paneer|ghee|lassi|shrikhand|kadhi|payasam|peda|rasgulla|gulab jamun|kaju katli|burfi|raita|badam milk|milkshake|kesari|cheese)\b/i;
const GLUTEN_KEYWORDS = /\b(dosa|parotta|chapati|phulka|poori|naan|paratha|roti|kulcha|bhatura|pav|thepla|oats|upma|bread|sandwich|semiya|wheat|kichadi|jalebi|bhujia|samosa|pakora|vadai|vada pav|puri|tikki)\b/i;

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function inferFoodState(name) {
  const lower = name.toLowerCase();
  if (lower.includes('raw') || lower.includes('fresh')) return 'raw';
  if (lower.includes('boiled')) return 'boiled';
  if (lower.includes('steamed') || lower.includes('idli') || lower.includes('puttu') || lower.includes('idiyappam') || lower.includes('dhokla')) return 'steamed';
  if (lower.includes('fried') || lower.includes('fry') || lower.includes('poori') || lower.includes('bhatura') || lower.includes('samosa') || lower.includes('vada') || lower.includes('pakora') || lower.includes('chips') || lower.includes('jalebi')) return 'fried';
  if (lower.includes('roasted') || lower.includes('tandoori') || lower.includes('grilled') || lower.includes('tikka') || lower.includes('kebab')) return 'roasted';
  return 'cooked';
}

function inferServingOptionName(servingSize) {
  const s = servingSize.toLowerCase();
  if (s.includes('cup')) return 'Cup';
  if (s.includes('bowl')) return 'Bowl';
  if (s.includes('glass') || s.includes('tumbler')) return 'Glass';
  if (s.includes('tbsp')) return 'Tablespoon';
  if (s.includes('ml')) return 'ml';
  if (s.includes('plate')) return 'Plate';
  if (s.includes('piece')) return 'Piece';
  if (s.includes('sandwich')) return 'Sandwich';
  if (s.includes('g')) return 'Grams';
  return 'Serving';
}

function mapCsvRowToFoodDoc(fields, index) {
  const [
    rawCategory,
    rawName,
    servingSizeLabel,
    rawWeight,
    rawCalories,
    rawProtein,
    rawCarbs,
    rawFat,
    rawFiber,
    rawVerification,
    rawNote,
  ] = fields;

  const weight = Number(rawWeight) || 100;
  const calories = Number(rawCalories) || 0;
  const protein = Number(rawProtein) || 0;
  const carbs = Number(rawCarbs) || 0;
  const fat = Number(rawFat) || 0;
  const fiber = Number(rawFiber) || 0;

  const factor = 100 / weight;
  const caloriesKcal = Math.round(calories * factor * 10) / 10;
  const proteinG = Math.round(protein * factor * 10) / 10;
  const carbohydratesG = Math.round(carbs * factor * 10) / 10;
  const totalFatG = Math.round(fat * factor * 10) / 10;
  const fiberG = Math.round(fiber * factor * 10) / 10;

  let category = CATEGORY_MAP[rawCategory] || 'other';
  if (rawCategory === 'Snacks & sweets' && SWEET_KEYWORDS.test(rawName)) {
    category = 'sweets_and_desserts';
  }

  const isMl = servingSizeLabel.toLowerCase().includes('ml') ||
    rawCategory === 'Beverages' ||
    servingSizeLabel.toLowerCase().includes('glass') ||
    servingSizeLabel.toLowerCase().includes('tumbler');

  const isVegetarian = !NON_VEG_KEYWORDS.test(rawName);
  const isVegan = isVegetarian && !DAIRY_KEYWORDS.test(rawName);
  const isGlutenFree = !GLUTEN_KEYWORDS.test(rawName);
  const isHighProtein = proteinG >= 15 || protein >= 15;

  const primaryOptionName = inferServingOptionName(servingSizeLabel);
  const unitSuffix = isMl ? 'ml' : 'g';
  const servingOptions = [
    {
      name: primaryOptionName,
      weightGrams: weight,
      description: `${servingSizeLabel} (${weight}${unitSuffix})`,
      isDefault: true,
    },
  ];
  if (weight !== 1) {
    servingOptions.push({
      name: isMl ? 'ml' : 'Gram',
      weightGrams: 1,
      description: isMl ? 'Per ml' : 'Per gram',
      isDefault: false,
    });
  }

  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const dietaryTags = [];
  if (isVegetarian) dietaryTags.push('vegetarian');
  if (isVegan) dietaryTags.push('vegan');
  if (isGlutenFree) dietaryTags.push('gluten_free');
  if (isHighProtein) dietaryTags.push('high_protein');

  return {
    foodId: `XLS-${String(index + 1).padStart(3, '0')}`,
    canonicalName: rawName,
    displayName: rawName,
    name: rawName,
    alternateNames: rawName.includes(',')
      ? [rawName.split(',').map((s) => s.trim()).reverse().join(' ')]
      : [],
    transliterations: [slug],
    category,
    subcategory: rawCategory,
    cuisine: 'indian',
    dietaryTags,
    foodState: inferFoodState(rawName),
    nutrientBasis: `per 100 ${unitSuffix} edible portion`,
    caloriesKcal,
    proteinG,
    carbohydratesG,
    totalFatG,
    fiberG,
    nutritionPer100g: {
      calories: Math.round(caloriesKcal),
      protein: proteinG,
      carbs: carbohydratesG,
      fat: totalFatG,
      fiber: fiberG,
    },
    servingSize: weight,
    servingWeightGrams: weight,
    servingUnit: unitSuffix,
    servingOptions,
    tags: [rawCategory.toLowerCase(), slug, 'excel-indian-foods'],
    dietaryFlags: {
      isVegetarian,
      isVegan,
      isGlutenFree,
      isHighProtein,
    },
    dataSource: 'Reference Excel Workbook',
    sourceReference: rawNote || rawVerification || 'Not verified in HealthifyMe',
    verificationStatus: 'unverified',
    isVerified: false,
  };
}

function loadExcelFoodsFromCsv(csvPath = path.join(__dirname, 'data/indian_foods_excel.csv')) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 9 || !fields[0] || !fields[1]) continue;
    rows.push(mapCsvRowToFoodDoc(fields, rows.length));
  }
  return rows;
}

async function seedExcelFoods(options = {}) {
  const shouldDisconnect = options.disconnect !== false;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthfit';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
  }

  const docs = loadExcelFoodsFromCsv(options.csvPath);
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { foodId: doc.foodId },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await FoodItem.bulkWrite(ops, { ordered: false });
  const totalInDB = await FoodItem.countDocuments();

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }

  return {
    processed: docs.length,
    inserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
    totalInDB,
  };
}

if (require.main === module) {
  seedExcelFoods()
    .then((summary) => {
      console.log('Excel foods seed complete:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Excel foods seed failed:', err);
      process.exit(1);
    });
}

module.exports = {
  loadExcelFoodsFromCsv,
  seedExcelFoods,
};
