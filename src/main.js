import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME, APP_DESCRIPTION } from './constants'

const app = createApp(App)

// Initialize Pinia store
const pinia = createPinia()
app.use(pinia)

// Initialize router
app.use(router)

// Set the document title and description from constants
document.title = APP_NAME
document.querySelector('meta[name="description"]').setAttribute('content', APP_DESCRIPTION)

// Mount the app
app.mount('#app')
