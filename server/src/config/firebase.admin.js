const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized) return admin;

  try {
    if (admin.apps && admin.apps.length > 0) {
      initialized = true;
      return admin;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      admin.initializeApp({
        projectId: projectId || 'healthfit-dev',
      });
    }
  } catch (err) {
    console.warn('Firebase admin initialization warning:', err.message);
  }

  initialized = true;
  return admin;
}

module.exports = { initFirebase, admin };

