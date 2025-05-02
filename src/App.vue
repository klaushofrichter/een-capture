<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Goodbye Panel -->
    <div
      v-if="isLoggingOut"
      class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Goodbye!</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for using {{ APP_NAME }}. You will be logged out in
          {{ Math.ceil(logoutRemaining / 1000) }} seconds.
        </p>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
          <div
            class="bg-primary-600 h-2.5 rounded-full"
            :style="{ width: `${(logoutRemaining / 8000) * 100}%` }"
          ></div>
        </div>
        <div class="flex justify-center space-x-4">
          <button
            @click="handleCancelLogout"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel Logout
          </button>
          <button
            @click="handleImmediateLogout"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <nav v-if="!isLoginPage" class="bg-white dark:bg-gray-800 shadow-lg z-30 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-primary-600 dark:text-primary-400">{{
                APP_NAME
              }}</span>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/home"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/home'
                    ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Home
              </router-link>
              <router-link
                to="/profile"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/profile'
                    ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Profile
              </router-link>
              <router-link
                to="/about"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/about'
                    ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                About
              </router-link>
              <router-link
                to="/settings"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/settings'
                    ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Settings
              </router-link>
            </div>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              @click="handleLogout"
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Logout
            </button>
          </div>
          <div class="-mr-2 flex items-center sm:hidden">
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-controls="mobile-menu"
              :aria-expanded="isMobileMenuOpen"
            >
              <span class="sr-only">Open main menu</span>
              <svg
                class="block h-6 w-6"
                :class="{ hidden: isMobileMenuOpen }"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                class="hidden h-6 w-6"
                :class="{ block: isMobileMenuOpen }"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state. -->
      <div
        class="sm:hidden"
        :class="{ block: isMobileMenuOpen, hidden: !isMobileMenuOpen }"
        id="mobile-menu"
      >
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            to="/home"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/home'
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="closeMobileMenu"
          >
            Home
          </router-link>
          <router-link
            to="/profile"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/profile'
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="closeMobileMenu"
          >
            Profile
          </router-link>
          <router-link
            to="/about"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/about'
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="closeMobileMenu"
          >
            About
          </router-link>
          <router-link
            to="/settings"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/settings'
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="closeMobileMenu"
          >
            Settings
          </router-link>
          <button
            @click="handleLogoutAndCloseMenu"
            class="w-full text-left border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <!-- Overlay to capture outside clicks when mobile menu is open with blur effect -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 z-20 bg-black bg-opacity-30 backdrop-blur-sm transition-all duration-200"
      @click="closeMobileMenu"
    ></div>

    <!-- Main content wrapper -->
    <div :class="{ 'pointer-events-none': isMobileMenuOpen }">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { APP_NAME } from './constants'

// Route is used for navigation active classes
const route = useRoute()
// Router is used for programmatic navigation - though we use window.location directly in handleImmediateLogout
// eslint-disable-next-line no-unused-vars
const router = useRouter()
// Auth store is used for logout functionality
const authStore = useAuthStore()
// Theme store is used for dark/light mode functionality
// eslint-disable-next-line no-unused-vars
const themeStore = useThemeStore()
const isMobileMenuOpen = ref(false)
const isLoggingOut = ref(false)
const logoutRemaining = ref(8000)

const isLoginPage = computed(() => route.path === '/' || route.path === '/direct')

// Function to close the mobile menu
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Combined function to handle logout and close the menu
const handleLogoutAndCloseMenu = () => {
  closeMobileMenu()
  handleLogout()
}

// Handle ESC key press to close mobile menu
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

// Add keyboard event listener when component is mounted
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// Remove event listener when component is unmounted
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const handleLogout = async () => {
  isLoggingOut.value = true
  await authStore.logout(remaining => {
    logoutRemaining.value = remaining
  })
  // Hide the modal after logout completes
  isLoggingOut.value = false
}

const handleCancelLogout = () => {
  isLoggingOut.value = false
  logoutRemaining.value = 8000
  authStore.cancelLogout()
}

// Make the function async and use await/router.push
const handleImmediateLogout = async () => {
  isLoggingOut.value = false // Hide modal
  logoutRemaining.value = 8000 // Reset timer state just in case
  await authStore.logout() // Perform logout without delay
  // Navigate using router after logout is complete
  router.push('/')
}
</script>
