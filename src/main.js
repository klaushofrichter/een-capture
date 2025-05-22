import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME, APP_DESCRIPTION } from './constants'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth"
import { app, auth, db } from './firebase'

// Environment variables are handled by Vite. Ensure you have a .env file
// in your project root with VITE_ prefixed variables (e.g., VITE_FIREBASE_API_KEY)

// Validate critical environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_ADMIN_EMAIL',
  'VITE_FIREBASE_ADMIN_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

console.log("Firebase App initialized:", app);
console.log("Firebase Auth instance:", auth);
console.log("Firebase Firestore instance:", db);

// Set persistence and login admin user
const loginAdminUser = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Firebase Auth persistence set to browserLocalPersistence");
    console.log('Debug: Attempting to log in Firebase admin user:', import.meta.env.VITE_FIREBASE_ADMIN_EMAIL);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      import.meta.env.VITE_FIREBASE_ADMIN_EMAIL,
      import.meta.env.VITE_FIREBASE_ADMIN_PASSWORD
    );
    console.log('Debug: Firebase admin user logged in successfully.');
    console.log('Debug: UserCredential:', userCredential);
    console.log('Debug: Logged in user UID:', userCredential.user.uid);
    console.log('Debug: Logged in user Email:', userCredential.user.email);
  } catch (error) {
    console.error('Debug: Firebase admin login failed.', error);
    console.error('Debug: Error code:', error.code);
    console.error('Debug: Error message:', error.message);
  }
};

// Handle 404 redirects from GitHub Pages
const handleGitHubPagesRedirect = () => {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (redirect) {
    // Remove the query parameter to avoid infinite loops
    const newUrl = window.location.href.split('?')[0]
    window.history.replaceState(null, null, newUrl)
    // Navigate to the original path
    router.push(redirect)
  }
}

const appVue = createApp(App)
const pinia = createPinia()
appVue.use(pinia)
appVue.use(router)
document.title = APP_NAME
document.querySelector('meta[name="description"]').setAttribute('content', APP_DESCRIPTION)
handleGitHubPagesRedirect()
appVue.mount('#app')

// Call the login function after the app is mounted
// loginAdminUser();
