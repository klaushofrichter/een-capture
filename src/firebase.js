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

// Validate domain before initializing Firebase
validateDomain();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 