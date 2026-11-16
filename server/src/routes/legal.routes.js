const express = require('express');
const router = express.Router();

const COMMON_STYLES = `
    :root {
      --primary: #10B981;
      --primary-dark: #059669;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #1E293B;
      --muted: #64748B;
      --border: #E2E8F0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #064E3B 0%, #065F46 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      color: #A7F3D0;
      font-size: 1rem;
    }
    .nav-tabs {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 18px;
    }
    .nav-tabs a {
      color: white;
      text-decoration: none;
      background: rgba(255, 255, 255, 0.15);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    .nav-tabs a.active, .nav-tabs a:hover {
      background: white;
      color: #065F46;
    }
    .container {
      max-width: 820px;
      margin: -20px auto 50px auto;
      padding: 0 16px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border);
      padding: 32px;
      margin-bottom: 24px;
    }
    h2 {
      color: #0F172A;
      font-size: 1.35rem;
      border-bottom: 2px solid #ECFDF5;
      padding-bottom: 8px;
      margin-top: 24px;
    }
    h2:first-of-type {
      margin-top: 0;
    }
    p, li {
      color: #334155;
      font-size: 0.98rem;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .highlight-box {
      background: #ECFDF5;
      border-left: 4px solid var(--primary);
      padding: 16px;
      border-radius: 6px;
      margin: 18px 0;
    }
    .highlight-box p {
      margin: 0;
      font-weight: 500;
      color: #065F46;
    }
    .warning-box {
      background: #FEF2F2;
      border-left: 4px solid #EF4444;
      padding: 16px;
      border-radius: 6px;
      margin: 18px 0;
    }
    .warning-box p {
      margin: 0;
      font-weight: 500;
      color: #991B1B;
    }
    .footer {
      text-align: center;
      color: var(--muted);
      font-size: 0.88rem;
      padding: 20px;
      border-top: 1px solid var(--border);
    }
    a {
      color: var(--primary-dark);
      text-decoration: underline;
    }
`;

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Fitly Health & Fitness</title>
  <style>${COMMON_STYLES}</style>
</head>
<body>

  <div class="header">
    <h1>Fitly Privacy Policy</h1>
    <p>Last Updated: November 16, 2026 | Effective Date: November 16, 2026</p>
    <div class="nav-tabs">
      <a href="/privacy-policy" class="active">Privacy Policy</a>
      <a href="/terms">Terms & Conditions</a>
    </div>
  </div>

  <div class="container">
    <div class="card">
      <div class="highlight-box">
        <p>🔒 <strong>Our Commitment:</strong> Fitly is committed to protecting your privacy and personal health information. We do not sell your personal data or health metrics to third parties or advertisers.</p>
      </div>

      <h2>1. Introduction</h2>
      <p>Fitly ("we", "us", or "our") provides an AI-powered fitness, calorie tracking, and nutritional health application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related online services.</p>

      <h2>2. Information We Collect</h2>
      <p>We collect information to provide personalized health insights, calorie calculations, and workout tracking:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, password (securely hashed with bcrypt), and profile avatar.</li>
        <li><strong>Physical & Health Metrics:</strong> Age, gender, height, current weight, target weight, activity level, and dietary preferences.</li>
        <li><strong>Nutrition & Meal Logs:</strong> Food items logged, calories, macronutrients (protein, carbs, fats), meal timing, and water intake.</li>
        <li><strong>Activity & Workout Data:</strong> Logged exercises, repetitions, sets, workout duration, and estimated calories burned.</li>
        <li><strong>Ria AI Coach Conversations:</strong> Prompts submitted to the AI coach to analyze meals or provide dietary advice.</li>
      </ul>

      <h2>3. Google Health Connect & Apple Health Data</h2>
      <p>If you choose to enable wearable or device integration (via Android Health Connect or Apple Health), Fitly requests permission to read:</p>
      <ul>
        <li><code>READ_STEPS</code>: Daily step count to calculate total daily energy expenditure (TDEE).</li>
        <li><code>READ_ACTIVE_CALORIES_BURNED</code>: Calorie burn from workouts to adjust your remaining calorie budget.</li>
        <li><code>READ_SLEEP_SESSION</code>: Sleep duration to track daily recovery habits.</li>
      </ul>
      <div class="highlight-box">
        <p>🛡️ <strong>Health Data Protection Notice:</strong> In strict compliance with Google Play Health Connect and Apple Health guidelines, your health data is used solely to display your daily dashboard progress. It is <strong>never</strong> transferred to data brokers, advertising platforms, or third-party marketing entities.</p>
      </div>

      <h2>4. How We Use Your Information</h2>
      <ul>
        <li>To compute your Basal Metabolic Rate (BMR) and recommended daily calorie/macro targets.</li>
        <li>To analyze meal logs with ICMR-NIN verified nutritional data and Ria AI Coach.</li>
        <li>To track your historical weight trends and habit streaks.</li>
        <li>To maintain app security, authenticate user sessions, and prevent fraud.</li>
      </ul>

      <h2>5. AI & Nutritional Advice Disclaimer</h2>
      <p>Ria AI Coach provides nutritional breakdowns and dietary suggestions for general fitness and wellness educational purposes. Fitly is <strong>not a medical device</strong> and does not provide clinical diagnosis or treatment. Consult a licensed medical doctor or registered clinical dietitian before starting any intensive diet or exercise program.</p>

      <h2>6. Data Security & Storage</h2>
      <p>All network communications between the mobile application and our servers are encrypted using Transport Layer Security (TLS/HTTPS). User passwords and sensitive tokens are encrypted using industry-standard hashing algorithms. Database records are stored securely in cloud-hosted MongoDB Atlas with strict IP whitelisting and role-based access control.</p>

      <h2>7. User Rights & Account Deletion</h2>
      <p>In accordance with Google Play Store policies and global privacy standards (including GDPR and CCPA), you have the right to:</p>
      <ul>
        <li><strong>Access & Export:</strong> View all logged health, meal, and workout data inside the app.</li>
        <li><strong>Correction:</strong> Update profile metrics, weight goals, and logs at any time.</li>
        <li><strong>Account Deletion:</strong> You can delete your account and all associated personal and health data directly in the app (under Profile > Settings > Delete Account) or by emailing us at <a href="mailto:dhinagarandhinagar70@gmail.com">dhinagarandhinagar70@gmail.com</a> with the subject "Delete My Account". All data will be permanently wiped within 7 business days.</li>
      </ul>

      <h2>8. Children's Privacy</h2>
      <p>Fitly is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions or concerns regarding this Privacy Policy or your data, please contact our Data Protection Team at:</p>
      <p>
        <strong>Fitly Health & Fitness Support</strong><br>
        Email: <a href="mailto:dhinagarandhinagar70@gmail.com">dhinagarandhinagar70@gmail.com</a><br>
        Website: <a href="https://fitly-backend-tkzw.onrender.com">https://fitly-backend-tkzw.onrender.com</a>
      </p>
    </div>
  </div>

  <div class="footer">
    &copy; 2026 Fitly Health & Fitness. All rights reserved.
  </div>

</body>
</html>`;

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms and Conditions - Fitly Health & Fitness</title>
  <style>${COMMON_STYLES}</style>
</head>
<body>

  <div class="header">
    <h1>Fitly Terms & Conditions</h1>
    <p>Last Updated: November 16, 2026 | Effective Date: November 16, 2026</p>
    <div class="nav-tabs">
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms" class="active">Terms & Conditions</a>
    </div>
  </div>

  <div class="container">
    <div class="card">
      <div class="warning-box">
        <p>⚠️ <strong>Important Medical Disclaimer:</strong> Fitly is not a medical organization or clinical provider. The content, calorie calculations, and Ria AI Coach suggestions are provided for educational and fitness tracking purposes only. Consult a physician before beginning any diet or workout regimen.</p>
      </div>

      <h2>1. Agreement to Terms</h2>
      <p>By downloading, installing, registering, or using the Fitly mobile application or services, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must immediately cease using the application.</p>

      <h2>2. Eligibility & Account Responsibilities</h2>
      <ul>
        <li>You must be at least 13 years old to create an account and use Fitly.</li>
        <li>You agree to provide accurate, truthful, and complete information during registration and keep your profile metrics up to date.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials and password. Fitly cannot and will not be liable for any loss resulting from unauthorized account access.</li>
      </ul>

      <h2>3. Health, Nutrition & Exercise Disclaimer</h2>
      <p>Fitness activities and dietary adjustments involve inherent risks of physical injury or metabolic health changes:</p>
      <ul>
        <li>Fitly does not provide medical diagnosis, clinical treatment, or emergency medical services.</li>
        <li>Calorie targets and macronutrient splits (protein, carbohydrates, fat) are calculated using standardized metabolic equations (Mifflin-St Jeor / Harris-Benedict) and should be used as general guidelines.</li>
        <li>Always perform exercises with proper form, warm up appropriately, and stop immediately if you experience pain, dizziness, or shortness of breath.</li>
      </ul>

      <h2>4. Ria AI Coach Terms of Use</h2>
      <p>Ria AI Coach utilizes artificial intelligence and verified nutritional databases (such as ICMR-NIN) to estimate calories and offer suggestions:</p>
      <ul>
        <li>Nutritional values for regional recipes, portions, and restaurant preparations are approximations and may vary based on ingredients and cooking methods.</li>
        <li>AI recommendations do not replace personalized guidance from a certified dietitian, sports nutritionist, or healthcare professional.</li>
      </ul>

      <h2>5. Google Health Connect & Wearable Integration</h2>
      <p>When syncing with Google Health Connect, Apple Health, or supported wearable devices, Fitly reads your step count, active calories, and sleep duration. You retain full control over these permissions through your device operating system settings and can revoke access at any time.</p>

      <h2>6. Community & Social Guidelines</h2>
      <p>If you participate in Fitly's community feed, challenges, or social leaderboards, you agree not to:</p>
      <ul>
        <li>Post abusive, hateful, defamatory, obscene, or threatening content.</li>
        <li>Promote extreme, dangerous, or medically unsupervised starvation diets or eating disorders.</li>
        <li>Spam other community members with unsolicited commercial promotions or affiliate links.</li>
      </ul>

      <h2>7. Intellectual Property Rights</h2>
      <p>All software, designs, trademarks, logos, workout routines, and database structures within Fitly are the exclusive intellectual property of Fitly and its licensors. You are granted a limited, personal, non-exclusive, non-transferable license to use the app for personal fitness tracking.</p>

      <h2>8. Account Termination & Cancellation</h2>
      <p>You may terminate your account at any time by requesting deletion in the app or contacting <a href="mailto:dhinagarandhinagar70@gmail.com">dhinagarandhinagar70@gmail.com</a>. Fitly reserves the right to suspend or terminate accounts that violate these Terms or compromise the security of the service.</p>

      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable law, Fitly, its developers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including physical injury, health complications, or data loss arising from the use of or inability to use the application.</p>

      <h2>10. Modifications to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. If material changes are made, we will notify you through the app or update the "Last Updated" date at the top of this document. Continued use of the app constitutes acceptance of the revised Terms.</p>

      <h2>11. Contact & Support</h2>
      <p>For questions or assistance regarding these Terms and Conditions, please contact us at:</p>
      <p>
        <strong>Fitly Legal & Support Team</strong><br>
        Email: <a href="mailto:dhinagarandhinagar70@gmail.com">dhinagarandhinagar70@gmail.com</a><br>
        Website: <a href="https://fitly-backend-tkzw.onrender.com">https://fitly-backend-tkzw.onrender.com</a>
      </p>
    </div>
  </div>

  <div class="footer">
    &copy; 2026 Fitly Health & Fitness. All rights reserved.
  </div>

</body>
</html>`;

// Handler that smartly serves Terms or Privacy based on route
router.get('/', (req, res) => {
  const url = req.baseUrl || req.originalUrl || '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (url.includes('terms')) {
    return res.send(TERMS_HTML);
  }
  return res.send(PRIVACY_HTML);
});

router.get('/terms', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(TERMS_HTML);
});

router.get('/privacy-policy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(PRIVACY_HTML);
});

module.exports = router;
