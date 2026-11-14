# HealthFit — Indian Food Database Architecture & Expansion Guide

This document outlines the design, data pipeline, and expansion procedures for the **HealthFit Indian Food Database**, with special focus on South Indian and Tamil Nadu regional cuisine.

---

## 1. Overview & Data Sources

The database is built using verified nutritional composition data:
1. **ICMR – National Institute of Nutrition (NIN) IFCT 2017** (Indian Food Composition Tables).
2. **USDA FoodData Central API** for standard global raw ingredients.
3. **Recipe Yield Conversions** for traditional prepared South Indian dishes (Idli, Dosa, Sambar, Kuzhambu, Biryani, Koozh).

> [!IMPORTANT]
> **Data Integrity:** Missing or unverified nutrient values are stored as `null` rather than assumed `0`s to preserve mathematical integrity.

---

## 2. Food Schema Structure (`FoodItem` model)

Each food item record contains over 30 structured fields:

```json
{
  "foodId": "TN-TIF-001",
  "canonicalName": "Idli",
  "displayName": "Steamed Idli (Rice & Black Gram)",
  "alternateNames": ["Idly", "Rice Idli"],
  "regionalNames": { "ta": ["இட்லி"], "hi": ["इडली"] },
  "transliterations": ["idli", "idly", "ittili"],
  "category": "south_indian_tiffin",
  "subcategory": "Idli Varieties",
  "cuisine": "south_indian",
  "region": "Tamil Nadu",
  "dietaryTags": ["vegetarian", "vegan", "gluten_free", "low_fat"],
  "ingredients": ["Rice", "Black Gram (Urad Dal)", "Fenugreek Seeds", "Salt"],
  "preparationMethod": "Fermented batter steamed in traditional moulds",
  "foodState": "steamed",
  "nutrientBasis": "per 100 g edible portion",
  "caloriesKcal": 156,
  "proteinG": 4.4,
  "carbohydratesG": 33.8,
  "totalFatG": 0.4,
  "fiberG": 1.6,
  "sugarG": 0.2,
  "saturatedFatG": 0.1,
  "sodiumMg": 190,
  "servingOptions": [
    { "name": "Piece", "weightGrams": 50, "description": "1 medium idli (50g)", "isDefault": true },
    { "name": "Plate", "weightGrams": 100, "description": "2 idlis (100g)", "isDefault": false },
    { "name": "Gram", "weightGrams": 1, "description": "Per gram", "isDefault": false }
  ],
  "servingWeightGrams": 50,
  "dataSource": "IFCT 2017",
  "sourceReference": "NIN IFCT 2017 Code C001",
  "verificationStatus": "verified",
  "isVerified": true
}
```

---

## 3. Database Seeding & Pipeline

### Pipeline File
`server/src/scripts/seedFoodsPipeline.js`

### Dataset File
`server/src/scripts/data/indian_foods_seed_dataset.json`

### Key Features of Seeding Pipeline:
1. **Idempotent Operations:** Updates existing records if `foodId` or `canonicalName` matches; inserts new records if missing. Re-running the script never creates duplicate documents.
2. **Automated Validation:**
   - Rejects negative nutrient values.
   - Enforces energy density bounds ($<900 \text{ kcal per } 100\text{g}$).
   - Validates presence of `canonicalName` and `category`.
3. **Execution Command:**
   ```bash
   node server/src/scripts/seedFoodsPipeline.js
   ```

---

## 4. Serving Size System

Foods support multiple customizable serving units:
- **Piece** (e.g., 1 Idli = 50g, 1 Dosa = 80g, 1 Roti = 40g)
- **Bowl / Katori** (e.g., 1 Bowl Sambar = 150ml, 1 Bowl Rice = 150g)
- **Ladle** (e.g., 1 Ladle Sambar = 75ml)
- **Glass / Tumbler** (e.g., 1 Glass Filter Coffee = 150ml, 1 Glass Koozh = 250ml)
- **Gram / Ml** (Standard 1:1 unit ratio)

---

## 5. Multi-Language & Transliteration Search

The search API handles:
- **English Names:** "Idli", "Plain Dosa", "Chicken Biryani"
- **Tamil Script:** "இட்லி", "தோசை", "தயிர் சாதம்"
- **Tamil Transliterations in English:**
  - `idly` $\rightarrow$ `Idli`
  - `dosai` $\rightarrow$ `Plain Dosa`
  - `thayir sadam` / `saadham` $\rightarrow$ `Curd Rice` / `Cooked White Rice`
  - `murungai keerai` $\rightarrow$ `Keerai Masiyal` / `Drumstick`
  - `kambu koozh` $\rightarrow$ `Pearl Millet Koozh`

---

## 6. Automated Testing

Run the full automated test suite (verifying idempotency, serving conversions, Tamil search transliterations, custom recipe calculation, and daily food logging):

```bash
node server/src/tests/foodDatabase.test.js
```

---

## 7. Scaling to 10,000+ Records

To progressively expand the food database:
1. Append batch JSON arrays into `server/src/scripts/data/indian_foods_seed_dataset.json` or create partitioned files (`batch_001.json`, `batch_002.json`).
2. Run `node server/src/scripts/seedFoodsPipeline.js`.
3. Verify metrics output for total records, inserted items, and duplicate skips.
