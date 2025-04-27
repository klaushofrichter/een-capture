<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            About {{ appName }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            A secure authentication application for Eagle Eye Networks
          </p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700">
          <div class="px-4 py-5 sm:p-6">
            <h4 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Features</h4>
            <ul class="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                Secure OAuth2 authentication with Eagle Eye Networks
              </li>
              <li class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                Token refresh and management
              </li>
              <li class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                User profile management
              </li>
              <li class="flex items-center">
                <svg
                  class="h-5 w-5 text-green-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                Dark mode support
              </li>
            </ul>
          </div>

          <div class="px-4 py-5 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Technology Stack
            </h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Frontend</h5>
                <ul class="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Vue 3</li>
                  <li>Vite</li>
                  <li>Tailwind CSS</li>
                  <li>Pinia</li>
                  <li>Vue Router</li>
                </ul>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Authentication</h5>
                <ul class="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>OAuth2</li>
                  <li>Eagle Eye Networks API</li>
                  <li>Local Storage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import packageJson from '../../package.json'

// We import auth store for potential future use but don't use it directly yet
// eslint-disable-next-line no-unused-vars
const authStore = useAuthStore()
const appName = computed(() => packageJson.displayName)

onMounted(() => {
  document.title = `${appName.value} - About`
})
</script>
