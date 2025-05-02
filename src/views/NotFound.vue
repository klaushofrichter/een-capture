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
          v-if="previousPageName && previousPageName !== 'Home'"
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

const router = useRouter()
const route = useRoute()
const previousPageName = ref('')
const canGoBack = ref(window.history.length > 1)

// Truncate the displayed path
const truncatedPath = computed(() => {
  const path = route.fullPath
  const maxLength = 40 // Adjust this length as needed
  if (path.length > maxLength) {
    return path.substring(0, maxLength) + '...'
  }
  return path
})

// Map of route paths to friendly names
const routeNameMap = {
  '/': 'Login',
  '/home': 'Home',
  '/about': 'About',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/direct': 'Direct Login'
}

function goBack() {
  if (canGoBack.value) {
    router.go(-1)
  } else {
    router.replace('/home')
  }
}

onBeforeMount(() => {
  // Get the previous route from the referrer or history state
  if (canGoBack.value) {
    const referrer = document.referrer

    if (referrer && referrer.includes(window.location.host)) {
      // Extract path from referrer URL
      try {
        const referrerUrl = new URL(referrer)
        const path = referrerUrl.pathname

        // Match the path to our route map
        previousPageName.value = routeNameMap[path] || 'Previous Page'
      } catch (e) {
        previousPageName.value = 'Previous Page'
      }
    } else {
      // If referrer is not available or not from our site
      previousPageName.value = 'Previous Page'
    }
  } else {
    previousPageName.value = 'Home'
  }
})

onMounted(() => {
  // Set the document title
  document.title = 'Page Not Found'
})
</script>
