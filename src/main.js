import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME, APP_DESCRIPTION } from './constants'
import app, { auth, db } from './firebase' // eslint-disable-line no-unused-vars
import { firebaseAuthService } from './services/firebase-auth'


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

// Initialize Firebase Auth Service
//console.log('Initializing Firebase Auth Service')
firebaseAuthService.initialize(app)
//console.log('Firebase Auth Service initialized')

document.title = APP_NAME
//console.log('Setting document title to', APP_NAME)
document.querySelector('meta[name="description"]').setAttribute('content', APP_DESCRIPTION)
//console.log('Setting document description to', APP_DESCRIPTION)
handleGitHubPagesRedirect()
//console.log('Handling GitHub Pages redirect')
appVue.mount('#app')
//console.log('App mounted')
