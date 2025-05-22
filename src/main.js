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

// Set persistence and login admin user (removed as per security plan)
// const loginAdminUser = async () => { ... }; // Removed the entire function block

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

// Call the login function after the app is mounted (removed as per security plan)
// loginAdminUser();
