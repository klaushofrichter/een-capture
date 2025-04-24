<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            Your Eagle Eye Networks account information
          </p>
        </div>
        <div class="border-t border-gray-200">
          <div class="px-4 py-5 sm:p-6">
            <div v-if="loading" class="text-center py-4">
              <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"
              ></div>
              <p class="mt-2 text-sm text-gray-500">Loading profile...</p>
            </div>
            <div v-else-if="error" class="text-center py-4">
              <p class="text-sm text-red-600">{{ error }}</p>
              <button
                @click="fetchUserProfile"
                class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Retry
              </button>
            </div>
            <div v-else-if="!userProfile" class="text-center py-4">
              <p class="text-sm text-gray-500">No profile data available</p>
            </div>
            <div v-else class="grid grid-cols-1 gap-6">
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div class="sm:col-span-1">
                  <dt class="text-sm font-medium text-gray-500">First Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ userProfile.firstName || 'N/A' }}</dd>
                </div>
                <div class="sm:col-span-1">
                  <dt class="text-sm font-medium text-gray-500">Last Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ userProfile.lastName || 'N/A' }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ userProfile.email || 'N/A' }}</dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-sm font-medium text-gray-500">User ID</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ userProfile.id || 'N/A' }}</dd>
                </div>
              </dl>
              
              <!-- Credentials Section -->
              <div class="mt-6 border-t border-gray-200 pt-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Credentials</h4>
                <div class="flex items-center space-x-4">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                    <input
                      :type="showToken ? 'text' : 'password'"
                      :value="authStore.token"
                      readonly
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="toggleAndCopyToken"
                      class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {{ showToken ? 'Hide' : 'Show & Copy' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { userService } from '../services/user'
import packageJson from '../../package.json'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const showToken = ref(false)

const userProfile = computed(() => authStore.userProfile)
const pageTitle = computed(() => `${packageJson.displayName} - Profile`)

async function fetchUserProfile() {
  if (!authStore.baseUrl || !authStore.token) {
    error.value = 'Please log in to view your profile'
    return
  }

  // If we already have the profile data, no need to fetch again
  if (authStore.userProfile) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const data = await userService.getUserProfile()
    authStore.setUserProfile({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    })
  } catch (err) {
    error.value = err.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

function copyToken() {
  if (authStore.token) {
    navigator.clipboard.writeText(authStore.token)
  }
}

function toggleAndCopyToken() {
  showToken.value = !showToken.value
  if (showToken.value) {
    copyToken()
  }
}

onMounted(() => {
  document.title = pageTitle.value
  fetchUserProfile()
})
</script>
