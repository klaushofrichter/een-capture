<template>
  <div
    v-if="!isProcessingCallback"
    class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
  >
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome to {{ appName }}</h2>
      <button
        @click="handleLogin"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Sign in with Eagle Eye Networks
      </button>
    </div>
    <div class="absolute bottom-4 flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
      <span>v{{ appVersion }}</span>
      <span class="text-gray-300 dark:text-gray-600">|</span>
      <a
        href="https://github.com/klaushofrichter/een-login/blob/develop/README.md"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-600 dark:hover:text-gray-400"
        title="View README"
      >
        README
      </a>
    </div>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <!-- Loading state while processing callback -->
    <div class="flex items-center space-x-2">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
      <span class="text-gray-600 dark:text-gray-400">Logging in...</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAuthUrl, handleAuthCallback } from '../services/auth'
import { useAuthStore } from '../stores/auth'
import packageJson from '../../package.json'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appName = computed(() => packageJson.displayName)
const appVersion = computed(() => packageJson.version)
const isProcessingCallback = ref(false)

const handleLogin = () => {
  const url = getAuthUrl()  
  // this will redirect to the EEN login page, and after login, the user will be redirected to the callback URL
  window.location.href = url
}

// Check for OAuth code before mounting component
const hasOAuthCode = computed(() => !!route.query.code)

onMounted(async () => {
  // Check if we're returning from OAuth callback
  const code = route.query.code
  if (code) {
    isProcessingCallback.value = true
    try {
      const success = await handleAuthCallback(code)
      if (success) {
        router.push('/home')
      }
    } catch (error) {
      console.error('Error processing callback:', error)
      isProcessingCallback.value = false
    }
  } else {
    document.title = `${appName.value} - Login`
  }
})
</script>
