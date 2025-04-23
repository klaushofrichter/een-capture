<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to EEN Login</h2>
      <button
        @click="handleLogin"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Sign in with Eagle Eye Networks
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAuthUrl, handleAuthCallback } from '../services/auth'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogin = () => {
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