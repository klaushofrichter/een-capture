<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to {{ APP_NAME }}</h2>
      <button
        @click="handleLogin"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Sign in with Eagle Eye Networks
      </button>
    </div>
    <div class="absolute bottom-4 flex items-center space-x-2 text-xs text-gray-400">
      <span>v{{ APP_VERSION }}</span>
      <span class="text-gray-300">|</span>
      <a
        href="https://github.com/klaushofrichter/een-login/blob/develop/README.md"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-600"
        title="View README"
      >
        README
      </a>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAuthUrl, handleAuthCallback } from '../services/auth'
import { useAuthStore } from '../stores/auth'
import { APP_NAME, APP_VERSION } from '../constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogin = () => {
  console.log(`handleLogin`)
  console.log(`getAuthUrl: ${getAuthUrl()}`)
  window.location.href = getAuthUrl()
}

onMounted(async () => {
  // Check if we're returning from OAuth callback
  const code = route.query.code
  if (code) {
    const success = await handleAuthCallback(code)
    if (success) {
      router.push('/home')
    }
  }
})
</script>
