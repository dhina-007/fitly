const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },   // grams
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },     // mg
  cholesterol: { type: Number, default: 0 }, // mg
  saturatedFat: { type: Number, default: 0 },
}, { _id: false });

const servingOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Piece', 'Cup', 'Bowl', 'Katori', 'Ladle', 'Gram', 'Ml'
  weightGrams: { type: Number, required: true }, // weight equivalent in grams/ml
  description: { type: String }, // e.g., '1 medium idli (50g)'
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const foodItemSchema = new mongoose.Schema({
  // Identification
  foodId: { type: String, index: true, unique: true, sparse: true },
  canonicalName: { type: String, required: true, trim: true, index: true },
  displayName: { type: String, trim: true },
  name: { type: String, trim: true }, // Alias for canonicalName / backwards compatibility
  nameLocal: { type: String }, // Local language name (e.g. தமிழ்)

  // Language & Transliterations
  alternateNames: [{ type: String }],
  regionalNames: {
    ta: [{ type: String }], // Tamil
    hi: [{ type: String }], // Hindi
    te: [{ type: String }], // Telugu
    kn: [{ type: String }], // Kannada
    ml: [{ type: String }], // Malayalam
  },
  transliterations: [{ type: String }], // e.g., ['dosai', 'thayir sadam', 'saadham', 'murungai keerai']

  // Categorization
  category: { 
    type: String, 
    required: true, 
    enum: [
      'south_indian_tiffin',
      'tamil_meals',
      'chutneys_gravies_sides',
      'north_indian',
      'rice_and_grains',
      'vegetables_and_greens',
      'fruits',
      'protein_foods',
      'dairy_and_alternatives',
      'snacks_and_street_foods',
      'sweets_and_desserts',
      'drinks',
      'packaged_and_branded',
      'homemade_and_recipes',
      // Legacy enum values preserved for backwards compatibility
      'grains', 'vegetables', 'protein', 'dairy', 'snacks', 'sweets', 'spices', 'oils', 'nuts', 'legumes', 'other'
    ] 
  },
  subcategory: { type: String },
  cuisine: { 
    type: String, 
    enum: ['south_indian', 'tamil_nadu', 'north_indian', 'pan_indian', 'chinese', 'continental', 'other', 'indian'], 
    default: 'south_indian' 
  },
  region: { type: String }, // e.g., 'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Punjab', 'Kerala'

  // Food Attributes
  dietaryTags: [{ type: String }], // ['vegetarian', 'vegan', 'gluten_free', 'high_protein', 'low_carb']
  ingredients: [{ type: String }],
  preparationMethod: { type: String },
  foodState: { 
    type: String, 
    enum: ['raw', 'cooked', 'boiled', 'fried', 'roasted', 'steamed', 'baked'], 
    default: 'cooked' 
  },
  nutrientBasis: { type: String, default: 'per 100 g edible portion' },

  // Precise Nutrient Fields (Allowing null for unverified/unavailable data)
  caloriesKcal: { type: Number, default: null },
  proteinG: { type: Number, default: null },
  carbohydratesG: { type: Number, default: null },
  totalFatG: { type: Number, default: null },
  fiberG: { type: Number, default: null },
  sugarG: { type: Number, default: null },
  saturatedFatG: { type: Number, default: null },
  sodiumMg: { type: Number, default: null },

  // Servings System
  servingOptions: [servingOptionSchema],
  servingWeightGrams: { type: Number, default: 100 },
  servingSize: { type: Number }, // legacy serving size
  servingUnit: { type: String, default: 'g' },

  // Legacy Nutrition Objects (Computed dynamically or populated for legacy endpoints)
  nutrition: { type: nutritionSchema },
  nutritionPer100g: { type: nutritionSchema },

  // Metadata & Attribution
  barcode: { type: String, sparse: true, index: true },
  brand: { type: String },
  image: { type: String },
  dataSource: { type: String, default: 'IFCT 2017' }, // e.g. 'IFCT 2017', 'USDA FoodData Central', 'Estimated Recipe'
  sourceReference: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['verified', 'estimated', 'user_created', 'unverified'], 
    default: 'verified' 
  },
  isVerified: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },
  createdBy: { type: String }, // firebase uid for custom foods
  tags: [{ type: String }],
  allergens: [{ type: String }],
  dietaryFlags: {
    isVegetarian: { type: Boolean, default: true },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isJain: { type: Boolean, default: false },
  },
}, { timestamps: true });

// Pre-save hook to keep name and canonicalName in sync & calculate legacy fields if missing
foodItemSchema.pre('save', function() {
  if (!this.canonicalName && this.name) {
    this.canonicalName = this.name;
  }
  if (!this.name && this.canonicalName) {
    this.name = this.canonicalName;
  }
  if (!this.displayName) {
    this.displayName = this.canonicalName;
  }

  // Populate legacy nutritionPer100g if caloriesKcal is defined
  if (this.caloriesKcal !== null && this.caloriesKcal !== undefined) {
    this.nutritionPer100g = {
      calories: Math.round(this.caloriesKcal),
      protein: this.proteinG !== null ? Math.round(this.proteinG * 10) / 10 : 0,
      carbs: this.carbohydratesG !== null ? Math.round(this.carbohydratesG * 10) / 10 : 0,
      fat: this.totalFatG !== null ? Math.round(this.totalFatG * 10) / 10 : 0,
      fiber: this.fiberG !== null ? Math.round(this.fiberG * 10) / 10 : 0,
      sugar: this.sugarG !== null ? Math.round(this.sugarG * 10) / 10 : 0,
      sodium: this.sodiumMg !== null ? Math.round(this.sodiumMg) : 0,
      saturatedFat: this.saturatedFatG !== null ? Math.round(this.saturatedFatG * 10) / 10 : 0,
    };
  }

  // Ensure standard default servingOption exists if none provided
  if (!this.servingOptions || this.servingOptions.length === 0) {
    const weight = this.servingWeightGrams || this.servingSize || 100;
    const unit = this.servingUnit || 'g';
    this.servingOptions = [{
      name: unit === 'g' ? 'Gram' : unit,
      weightGrams: weight,
      description: `${weight}${unit}`,
      isDefault: true,
    }];
  }
});


foodItemSchema.index({ 
  canonicalName: 'text', 
  displayName: 'text', 
  alternateNames: 'text', 
  transliterations: 'text',
  'regionalNames.ta': 'text',
  'regionalNames.hi': 'text',
  tags: 'text' 
}, {
  weights: {
    canonicalName: 10,
    displayName: 8,
    transliterations: 6,
    alternateNames: 5,
    'regionalNames.ta': 4,
    tags: 2
  },
  name: 'FoodTextIndex'
});

foodItemSchema.index({ category: 1, cuisine: 1 });
foodItemSchema.index({ foodState: 1, verificationStatus: 1 });

module.exports = mongoose.model('FoodItem', foodItemSchema);

