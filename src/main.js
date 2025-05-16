import './assets/main.css'
import './assets/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME, APP_DESCRIPTION } from './constants'
import { initializeApp } from "firebase/app";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "een-capture",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

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
