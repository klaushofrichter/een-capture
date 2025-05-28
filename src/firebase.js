import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Security: Validate that we're running on an authorized domain
function validateDomain() {
  const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'klaushofrichter.github.io'
  ];
  
  const currentDomain = window.location.hostname;
  const isAuthorized = allowedDomains.includes(currentDomain);
  
  if (!isAuthorized) {
    console.error(`🚫 Unauthorized domain: ${currentDomain}. Firebase services disabled.`);
    throw new Error(`Access denied: Unauthorized domain ${currentDomain}`);
  }
  
  console.log(`✅ Authorized domain verified: ${currentDomain}`);
  return true;
}

// Security: Validate Firebase configuration
function validateFirebaseConfig(config) {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  for (const field of requiredFields) {
    if (!config[field] || typeof config[field] !== 'string' || config[field].trim() === '') {
      throw new Error(`Missing or invalid Firebase configuration: ${field}`);
    }
  }
  
  // Validate apiKey format (should be a long string)
  if (config.apiKey.length < 30) {
    throw new Error('Invalid Firebase API key format');
  }
  
  // Validate domains in authDomain
  const allowedAuthDomains = [
    'een-capture.firebaseapp.com',
    'localhost'
  ];
  
  const authDomainValid = allowedAuthDomains.some(domain => 
    config.authDomain.includes(domain)
  );
  
  if (!authDomainValid) {
    throw new Error(`Unauthorized Firebase auth domain: ${config.authDomain}`);
  }
  
  return true;
}

// Security: Check if running in development mode
function isDevelopment() {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Perform security validations
validateDomain();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
validateFirebaseConfig(firebaseConfig);

// Security: Additional runtime checks
if (!isDevelopment()) {
  // In production, ensure we're using HTTPS
  if (window.location.protocol !== 'https:') {
    throw new Error('HTTPS required in production environment');
  }
  
  // Check for debug flags that shouldn't be enabled in production
  if (window.localStorage.getItem('debug') || window.sessionStorage.getItem('debug')) {
    console.warn('🚫 Debug mode detected in production environment');
    window.localStorage.removeItem('debug');
    window.sessionStorage.removeItem('debug');
  }
}

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} else {
  app = getApps()[0];
  console.log('✅ Firebase app already initialized');
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app; 