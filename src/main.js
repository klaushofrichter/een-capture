import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME, APP_DESCRIPTION } from './constants'
import { initializeApp } from "firebase/app"

// Environment variables are handled by Vite. Ensure you have a .env file
// in your project root with VITE_ prefixed variables (e.g., VITE_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("Firebase Config being used:", firebaseConfig);

// Initialize Firebase
initializeApp(firebaseConfig);

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

const app = createApp(App)

// Initialize Pinia store
const pinia = createPinia()
app.use(pinia)

// Initialize router
app.use(router)

// Set the document title and description from constants
document.title = APP_NAME
document.querySelector('meta[name="description"]').setAttribute('content', APP_DESCRIPTION)

// Handle GitHub Pages 404 redirect before mounting the app
handleGitHubPagesRedirect()

// Mount the app
app.mount('#app')
