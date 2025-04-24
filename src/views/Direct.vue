<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Direct Access to {{ appName }}</h2>
      <div v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</div>
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form class="space-y-6" @submit.prevent="handleSubmit">
            <div>
              <label for="token" class="block text-sm font-medium text-gray-700">
                Access Token
              </label>
              <div class="mt-1">
                <input
                  id="token"
                  v-model="token"
                  type="password"
                  required
                  autocomplete="off"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-8 gap-4">
              <div class="col-span-6">
                <label for="baseUrl" class="block text-sm font-medium text-gray-700">
                  Base URL
                </label>
                <div class="mt-1">
                  <input
                    id="baseUrl"
                    v-model="baseUrl"
                    type="text"
                    required
                    placeholder="e.g. api.eagleeyenetworks.com"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="col-span-2">
                <label for="port" class="block text-sm font-medium text-gray-700"> Port </label>
                <div class="mt-1">
                  <input
                    id="port"
                    v-model="port"
                    type="number"
                    required
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <div class="flex space-x-4">
                <button
                  type="button"
                  @click="router.push('/')"
                  class="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <span v-if="isLoading" class="flex items-center">
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                  <span v-else>Proceed</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 flex items-center space-x-2 text-xs text-gray-400">
      <span>v{{ appVersion }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { userService } from '../services/user'
import packageJson from '../../package.json'

const router = useRouter()
const authStore = useAuthStore()
const token = ref('')
const baseUrl = ref('')
const port = ref(443)
const error = ref('')
const isLoading = ref(false)
const appName = computed(() => packageJson.displayName)
const appVersion = computed(() => packageJson.version)

async function handleSubmit() {
  if (!token.value || !baseUrl.value || !port.value) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // First set the base URL and port
    authStore.setBaseUrl({
      hostname: baseUrl.value,
      port: port.value
    })

    // Then set the token
    authStore.setToken(token.value)

    // Then try to fetch the user profile to verify the token
    const userData = await userService.getUserProfile()

    // If successful, store the user data and proceed
    authStore.setUserProfile({
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    })

    router.push('/home')
  } catch (err) {
    error.value = err.message || 'Invalid credentials'
    authStore.setToken(null)
    authStore.setBaseUrl(null)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  document.title = `${appName.value} - Direct Access`
})
</script>
