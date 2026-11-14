const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const FoodItem = require('./server/src/models/FoodItem');

// Clean title map for the 71 items in database
const FOOD_DISPLAY_NAMES = {
  'akkiroti': 'Akki Roti',
  'aloogobi': 'Aloo Gobi',
  'alootikki': 'Aloo Tikki',
  'appamricehopper': 'Appam (Rice Hopper)',
  'bainganbharta': 'Baingan Bharta',
  'bhelpuri': 'Bhel Puri',
  'bhindimasala': 'Bhindi Masala',
  'bhujiasev': 'Bhujia / Sev',
  'bisibelebath': 'Bisi Bele Bath',
  'boiledegg': 'Boiled Egg',
  'butterchicken': 'Butter Chicken',
  'butternaan': 'Butter Naan',
  'chaklimurukku': 'Chakli / Murukku',
  'chickenbiryani': 'Chicken Biryani',
  'chickentikkamasala': 'Chicken Tikka Masala',
  'chholebhature': 'Chhole Bhature',
  'daltadkayellowlentils': 'Dal Tadka (Yellow Lentils)',
  'dhoklakhaman': 'Dhokla (Khaman)',
  'fishcurry': 'Fish Curry',
  'gajarkahalwa': 'Gajar Ka Halwa',
  'garlicnaan': 'Garlic Naan',
  'greekyogurtplain': 'Greek Yogurt (Plain)',
  'grilledchickenbreast': 'Grilled Chicken Breast',
  'gulabjamun': 'Gulab Jamun',
  'hyderabadihaleem': 'Hyderabadi Haleem',
  'idli': 'Idli (Steamed)',
  'jalebi': 'Jalebi',
  'kachoridalstuffed': 'Kachori (Dal Stuffed)',
  'kajukatli': 'Kaju Katli',
  'khandvi': 'Khandvi',
  'littichokha': 'Litti Chokha',
  'masaladosa': 'Masala Dosa',
  'mathri': 'Mathri',
  'meduvada': 'Medu Vada (Crispy)',
  'misalpav': 'Misal Pav',
  'misiroti': 'Misi Roti',
  'moongdalchila': 'Moong Dal Chila',
  'muttonroganjosh': 'Mutton Rogan Josh',
  'mysorepak': 'Mysore Pak',
  'neerdosa': 'Neer Dosa',
  'oatswithalmondmilk': 'Oats with Almond Milk',
  'palakpaneer': 'Palak Paneer',
  'paneerbuttermasala': 'Paneer Butter Masala',
  'paneertikka': 'Paneer Tikka',
  'panipurigolgappa': 'Pani Puri (Golgappa)',
  'paniyaramkuzhi': 'Kuzhi Paniyaram',
  'pavbhaji': 'Pav Bhaji',
  'payasamkheer': 'Payasam / Kheer',
  'peanutchikki': 'Peanut Chikki',
  'pesarattugreengramdosa': 'Pesarattu (Moong Dosa)',
  'plaindosa': 'Plain Dosa',
  'pohaflattenedrice': 'Poha (Flattened Rice)',
  'pongalvenpongal': 'Ven Pongal (Ghee Pongal)',
  'pooribhaji': 'Poori Bhaji',
  'puttu': 'Puttu (Steamed Rice Cake)',
  'rajmachawal': 'Rajma Chawal',
  'rasgulla': 'Rasgulla',
  'roastedchana': 'Roasted Chana',
  'roastedmakhana': 'Roasted Makhana',
  'rotichapati': 'Roti / Chapati',
  'sabudanakhichdi': 'Sabudana Khichdi',
  'sambar': 'South Indian Sambar',
  'samosapotatostuffed': 'Samosa (Potato Stuffed)',
  'sproutedmoongsalad': 'Sprouted Moong Salad',
  'steamedbasmatirice': 'Steamed Basmati Rice',
  'tandoorichicken': 'Tandoori Chicken',
  'thalipeeth': 'Thalipeeth',
  'theplamethi': 'Thepla (Methi)',
  'upmasemolina': 'Upma (Semolina)',
  'uttapam': 'Uttapam (Onion / Tomato)',
  'vadapav': 'Vada Pav'
};

const NON_VEG_KEYS = [
  'boiledegg', 'butterchicken', 'chickenbiryani', 'chickentikkamasala',
  'fishcurry', 'grilledchickenbreast', 'hyderabadihaleem', 'muttonroganjosh',
  'tandoorichicken'
];

async function updateFoods() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthfit';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const foods = await FoodItem.find({});
  console.log(`Found ${foods.length} foods in database.`);

  let updated = 0;
  for (const food of foods) {
    const key = food.canonicalName?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = FOOD_DISPLAY_NAMES[key] || food.displayName || food.name;
    const isNonVeg = NON_VEG_KEYS.includes(key);

    const updateFields = {
      name: cleanName,
      displayName: cleanName,
      'dietaryFlags.isVegetarian': !isNonVeg,
      'dietaryFlags.isVegan': !isNonVeg && !['greekyogurtplain', 'palakpaneer', 'paneerbuttermasala', 'paneertikka', 'payasamkheer', 'mysorepak', 'gulabjamun', 'butternaan'].includes(key),
    };

    await FoodItem.updateOne({ _id: food._id }, { $set: updateFields });
    updated++;
  }

  console.log(`Successfully updated and enriched ${updated} foods!`);
  await mongoose.disconnect();
}

updateFoods().catch(err => {
  console.error(err);
  process.exit(1);
});
