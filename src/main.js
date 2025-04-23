import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME } from './constants'

// Set the document title
document.title = APP_NAME

const app = createApp(App)

// Initialize Pinia store
const pinia = createPinia()
app.use(pinia)

// Initialize router
app.use(router)

// Mount the app
app.mount('#app') 