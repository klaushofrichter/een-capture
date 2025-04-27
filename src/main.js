import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { APP_NAME } from './constants'

const app = createApp(App)

// Initialize Pinia store
app.use(createPinia())

// Initialize router
app.use(router)

// Set the document title
document.title = APP_NAME

// Mount the app
app.mount('#app')
