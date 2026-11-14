const jwt = require('jsonwebtoken');
const { admin, initFirebase } = require('../config/firebase.admin');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fitly-super-secure-jwt-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function generateToken(user) {
  const payload = {
    _id: user._id?.toString(),
    uid: user.firebaseUid || user._id?.toString(),
    email: user.email,
    name: user.name,
    isAdmin: Boolean(user.isAdmin),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

initFirebase();

function resolveDevUid(rawToken) {
  if (!rawToken || !rawToken.startsWith('dev-token-')) {
    return 'dev-user-uid-12345';
  }
  const parsed = rawToken.replace('dev-token-', '').trim();
  if (!parsed || parsed === 'demo123') return 'dev-user-uid-12345';
  return parsed;
}

function decodeJwtPayloadUnsafe(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function attachUserFromToken(token) {
  // 1. Verify custom backend signed JWT
  try {
    const decodedJwt = jwt.verify(token, JWT_SECRET);
    if (decodedJwt && (decodedJwt.uid || decodedJwt._id)) {
      const dbUser = await User.findOne({
        $or: [
          ...(decodedJwt._id ? [{ _id: decodedJwt._id }] : []),
          ...(decodedJwt.uid ? [{ firebaseUid: decodedJwt.uid }] : []),
          ...(decodedJwt.email ? [{ email: decodedJwt.email.toLowerCase() }] : []),
        ],
      }).lean();

      return {
        _id: dbUser?._id?.toString() || decodedJwt._id || decodedJwt.uid,
        uid: dbUser?.firebaseUid || decodedJwt.uid || decodedJwt._id,
        email: dbUser?.email || decodedJwt.email,
        name: dbUser?.name || decodedJwt.name || 'Fitly User',
        emailVerified: true,
        isAdmin: Boolean(dbUser?.isAdmin || decodedJwt.isAdmin),
      };
    }
  } catch (jwtErr) {
    // If not our signed JWT or signature expired/invalid, continue to dev/firebase fallback
  }

  // 2. Handle dev-token-* tokens mapping cleanly to MongoDB user records
  if (token && token.startsWith('dev-token-')) {
    const uid = resolveDevUid(token);
    let dbUser = await User.findOne({ firebaseUid: uid }).lean();
    if (!dbUser) {
      try {
        dbUser = await User.create({
          firebaseUid: uid,
          email:
            uid === 'admin-user-uid-fitly'
              ? 'admin@fitly.app'
              : uid === 'dev-user-uid-12345'
                ? 'dhina@fitly.app'
                : `${uid}@fitly.app`,
          name: uid === 'admin-user-uid-fitly' ? 'Fitly Admin' : 'Dhina',
          isAdmin: uid === 'admin-user-uid-fitly',
        });
      } catch {
        dbUser = await User.findOne({ firebaseUid: uid }).lean();
      }
    }

    return {
      _id: dbUser?._id?.toString() || uid,
      uid,
      email:
        dbUser?.email ||
        (uid === 'admin-user-uid-fitly'
          ? 'admin@fitly.app'
          : uid === 'dev-user-uid-12345'
            ? 'dhina@fitly.app'
            : `${uid}@fitly.app`),
      name: dbUser?.name || (uid === 'admin-user-uid-fitly' ? 'Fitly Admin' : 'Dhina'),
      emailVerified: true,
      isAdmin: Boolean(dbUser?.isAdmin),
    };
  }

  const isDevEnv = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.FIREBASE_PROJECT_ID;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email ? decoded.email.toLowerCase() : null;
    const dbUser = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, ...(email ? [{ email }] : [])],
    }).lean();
    return {
      _id: dbUser?._id?.toString() || decoded.uid,
      uid: decoded.uid,
      email: decoded.email || dbUser?.email,
      name: decoded.name || dbUser?.name,
      emailVerified: decoded.email_verified,
      isAdmin: Boolean(decoded.admin || dbUser?.isAdmin),
    };
  } catch (err) {
    if (isDevEnv) {
      const payload = decodeJwtPayloadUnsafe(token);
      if (payload && (payload.user_id || payload.sub)) {
        const uid = payload.user_id || payload.sub;
        const email = payload.email ? payload.email.toLowerCase() : null;
        const dbUser = await User.findOne({
          $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])],
        }).lean();
        return {
          _id: dbUser?._id?.toString() || uid,
          uid,
          email: payload.email || dbUser?.email,
          name: payload.name || dbUser?.name || (email ? email.split('@')[0] : 'Fitly User'),
          emailVerified: Boolean(payload.email_verified),
          isAdmin: Boolean(payload.admin || dbUser?.isAdmin),
        };
      }

      const uid = resolveDevUid(token);
      const dbUser = await User.findOne({ firebaseUid: uid }).lean();
      return {
        _id: dbUser?._id?.toString() || uid,
        uid,
        email: dbUser?.email || 'dhina@fitly.app',
        name: dbUser?.name || 'Dhina',
        emailVerified: true,
        isAdmin: Boolean(dbUser?.isAdmin),
      };
    }
    throw err;
  }
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development / test mode, allow non-admin dev user fallback
      if (process.env.NODE_ENV !== 'production') {
        const dbUser = await User.findOne({ firebaseUid: 'dev-user-uid-12345' }).lean();
        req.user = {
          _id: dbUser?._id?.toString() || '6ac7e5d1ac9bff7edb7067a2',
          uid: 'dev-user-uid-12345',
          email: dbUser?.email || 'dhina@fitly.app',
          name: dbUser?.name || 'Dhina',
          emailVerified: true,
          isAdmin: false,
        };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
      req.user = await attachUserFromToken(token);
      return next();
    } catch (err) {
      if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const user = req.user || (await attachUserFromToken(token));
    req.user = user;

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. Only admins can create feed posts and communities.',
      });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token) {
        req.user = await attachUserFromToken(token);
      }
    }
  } catch (err) {
    // Continue without user context for public requests
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
  protect: requireAuth,
  generateToken,
  JWT_SECRET,
};
