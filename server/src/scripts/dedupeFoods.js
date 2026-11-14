const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FoodItem = require('../models/FoodItem');
const FoodLog = require('../models/FoodLog');

// Explicit mapping of legacy NOID food names to canonical XLS foodIds
const LEGACY_TO_XLS_MAP = {
  'roti / chapati': 'XLS-016',
  'paneer butter masala': 'XLS-168',
  'dal tadka (yellow lentils)': 'XLS-158',
  'steamed basmati rice': 'XLS-003',
  'idli (steamed)': 'XLS-004',
  'masala dosa': 'XLS-007',
  'south indian sambar': 'XLS-159',
  'chicken biryani': 'XLS-043',
  'grilled chicken breast': 'XLS-040',
  'boiled egg': 'XLS-037',
  'greek yogurt (plain)': 'XLS-049',
  'palak paneer': 'XLS-167',
  'roasted makhana': 'XLS-212',
  'samosa (potato stuffed)': 'XLS-083',
  'bhel puri': 'XLS-202',
  'pani puri (golgappa)': 'XLS-201',
  'vada pav': 'XLS-200',
  'dhokla (khaman)': 'XLS-195',
  khandvi: 'XLS-196',
  'aloo tikki': 'XLS-205',
  'chakli / murukku': 'XLS-088',
  'roasted chana': 'XLS-034',
  'peanut chikki': 'XLS-211',
  'pesarattu (moong dosa)': 'XLS-099',
  'poha (flattened rice)': 'XLS-114',
  'upma (semolina)': 'XLS-011',
  'thepla (methi)': 'XLS-156',
  'appam (rice hopper)': 'XLS-117',
  'puttu (steamed rice cake)': 'XLS-116',
  'bisi bele bath': 'XLS-125',
  'misi roti': 'XLS-152',
  'ven pongal (ghee pongal)': 'XLS-010',
  'neer dosa': 'XLS-101',
  'kuzhi paniyaram': 'XLS-108',
  'fish curry': 'XLS-044',
  'baingan bharta': 'XLS-172',
  'aloo gobi': 'XLS-171',
  'gulab jamun': 'XLS-090',
  rasgulla: 'XLS-225',
  jalebi: 'XLS-092',
  'kaju katli': 'XLS-224',
  'payasam / kheer': 'XLS-216',
  'mysore pak': 'XLS-091',
  'gajar ka halwa': 'XLS-226',
  'tandoori chicken': 'XLS-042',
  'uttapam (onion / tomato)': 'XLS-009',
  'plain dosa': 'XLS-006',
  'medu vada (crispy)': 'XLS-084',
  'pav bhaji': 'XLS-198',
};

function normKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function dedupeFoods(options = {}) {
  const shouldDisconnect = options.disconnect !== false;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthfit';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
  }

  const allFoods = await FoodItem.find({}).lean();
  const byFoodId = new Map();
  for (const f of allFoods) {
    if (f.foodId) byFoodId.set(f.foodId, f);
  }

  const deletions = new Map(); // duplicateIdStr -> replacementIdObj | null

  // 1. Remove mapped legacy duplicates & stale QA test artifacts
  for (const f of allFoods) {
    if (f.foodId && f.foodId.startsWith('XLS-')) continue;

    if (f.foodId && f.foodId.startsWith('CUSTOM-') && /^QA\s/i.test(f.name || '')) {
      deletions.set(String(f._id), null);
      continue;
    }

    const mappedXlsId = LEGACY_TO_XLS_MAP[(f.name || '').trim().toLowerCase()];
    if (mappedXlsId && byFoodId.has(mappedXlsId)) {
      deletions.set(String(f._id), byFoodId.get(mappedXlsId)._id);
    }
  }

  // 2. Also remove any remaining exact normalized name duplicates (preferring XLS-* items)
  const seenByNorm = new Map();
  const sorted = [...allFoods].sort((a, b) => {
    const aXls = a.foodId && a.foodId.startsWith('XLS-') ? 0 : 1;
    const bXls = b.foodId && b.foodId.startsWith('XLS-') ? 0 : 1;
    if (aXls !== bXls) return aXls - bXls;
    return String(a._id).localeCompare(String(b._id));
  });

  for (const f of sorted) {
    const idStr = String(f._id);
    if (deletions.has(idStr)) continue;
    const key = normKey(f.name || f.canonicalName);
    if (!key) continue;
    if (seenByNorm.has(key)) {
      deletions.set(idStr, seenByNorm.get(key)._id);
    } else {
      seenByNorm.set(key, f);
    }
  }

  // 3. Remap FoodLog references before removing duplicates
  let remappedLogs = 0;
  for (const [dupIdStr, targetId] of deletions.entries()) {
    const dupObjId = new mongoose.Types.ObjectId(dupIdStr);
    if (targetId) {
      const logRes = await FoodLog.updateMany(
        { 'entries.foodItem': dupObjId },
        { $set: { 'entries.$[elem].foodItem': targetId } },
        { arrayFilters: [{ 'elem.foodItem': dupObjId }] }
      );
      remappedLogs += logRes.modifiedCount || 0;
    }
  }

  const idsToDelete = [...deletions.keys()].map((id) => new mongoose.Types.ObjectId(id));
  let deletedCount = 0;
  if (idsToDelete.length > 0) {
    const delRes = await FoodItem.deleteMany({ _id: { $in: idsToDelete } });
    deletedCount = delRes.deletedCount || 0;
  }

  const remaining = await FoodItem.find({}, 'name canonicalName').lean();
  const remNorm = new Map();
  let remainingExactDups = 0;
  for (const item of remaining) {
    const k = normKey(item.name || item.canonicalName);
    if (remNorm.has(k)) remainingExactDups++;
    else remNorm.set(k, true);
  }

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }

  return {
    beforeCount: allFoods.length,
    deletedCount,
    remappedLogs,
    remainingCount: remaining.length,
    remainingExactDups,
  };
}

if (require.main === module) {
  dedupeFoods()
    .then((summary) => {
      console.log('Food deduplication complete:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Food deduplication failed:', err);
      process.exit(1);
    });
}

module.exports = { dedupeFoods };
