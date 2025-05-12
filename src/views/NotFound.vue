<template>
  <!-- Updated layout: Removed justify-center, using pt-6 for top spacing -->
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col text-center p-4 pt-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto shadow-lg">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page Not Found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6 break-words">
        The page <span class="font-semibold">{{ truncatedPath }}</span> does not exist.
      </p>
      <div class="space-y-3">
        <button
          v-if="showBackButton"
          @click="goBack"
          class="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm w-full"
        >
          Go Back to {{ previousPageName }}
        </button>
        <router-link
          to="/home"
          class="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm w-full"
        >
          Go to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeMount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const previousPageName = ref('')
const canGoBack = ref(false) // Will be determined in onBeforeMount

// Truncate the displayed path
const truncatedPath = computed(() => {
  const path = route.fullPath
  const maxLength = 40 // Adjust this length as needed
  if (path.length > maxLength) {
    return path.substring(0, maxLength) + '...'
  }
  return path
})

// Computed property to determine if we should show the back button
const showBackButton = computed(() => {
  // Never show back button if not authenticated
  if (!authStore.isAuthenticated) {
    console.log('Back button hidden: User not authenticated')
    return false
  }

  // Never show back button if we can't go back in history
  if (!canGoBack.value) {
    console.log('Back button hidden: No history to go back to')
    return false
  }

  // Check if we arrived here directly from external login
  if (isPreviousPageExternalLogin()) {
    console.log('Back button hidden: Previous page was external login')
    return false
  }

  // Check if we just arrived from login - this would be a post-login redirect to an invalid route
  const justLoggedIn = sessionStorage.getItem('justCompletedLogin') === 'true'
  if (justLoggedIn) {
    console.log('Back button hidden: Just completed login (post-login redirect to NotFound)')
    // Clear the flag now that we've used it
    sessionStorage.removeItem('justCompletedLogin')
    return false
  }

  // Check for a meaningful previous page name
  if (!previousPageName.value) {
    console.log('Back button hidden: No previous page name')
    return false
  }

  // If we pass all checks, show the back button
  console.log('Back button visible: All conditions met')
  return true
})

// Map of route paths to friendly names. this should be a computed property TODO:
const routeNameMap = {
  '/': 'Login',
  '/home': 'Home',
  '/about': 'About',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/direct': 'Direct Login'
}

function goBack() {
  router.go(-1)
}

// Helper to check if the previous page was an external login page
function isPreviousPageExternalLogin() {
  if (document.referrer) {
    try {
      // Parse the referrer as a URL
      const referrerUrl = new URL(document.referrer)

      // Check if the hostname is eagleeyenetworks.com or ends with .eagleeyenetworks.com
      const hostname = referrerUrl.hostname
      return hostname === 'eagleeyenetworks.com' || hostname.endsWith('.eagleeyenetworks.com')
    } catch (e) {
      // If URL parsing fails, return false for safety
      console.error('Error parsing referrer URL:', e)
      return false
    }
  }
  return false
}

onBeforeMount(() => {
  // Only enable back button if:
  // 1. There is history to go back to
  // 2. We're not coming from an external login page
  // 3. The user is authenticated (otherwise they'd just be sent to login again)
  canGoBack.value =
    window.history.length > 1 && !isPreviousPageExternalLogin() && authStore.isAuthenticated

  // We only set the previous page name if we can actually go back
  if (canGoBack.value) {
    // Default to "Previous Page"
    previousPageName.value = 'Previous Page'

    // Try to get a more specific name from referrer
    const referrer = document.referrer

    if (referrer && referrer.includes(window.location.host)) {
      try {
        const referrerUrl = new URL(referrer)
        const path = referrerUrl.pathname

        // Match the path to our route map
        if (routeNameMap[path]) {
          previousPageName.value = routeNameMap[path]
        }
      } catch (e) {
        // Keep the default "Previous Page" if there's an error
      }
    }
  } else {
    // No previous history available
    previousPageName.value = ''
  }

  // Add debugging to console
  console.log('NotFound page - canGoBack:', canGoBack.value)
  console.log('NotFound page - previousPageName:', previousPageName.value)
  console.log('NotFound page - history length:', window.history.length)
  console.log('NotFound page - isAuthenticated:', authStore.isAuthenticated)
  console.log('NotFound page - isPreviousPageExternalLogin:', isPreviousPageExternalLogin())
})

onMounted(() => {
  // Set the document title
  document.title = 'Page Not Found'
})
</script>
