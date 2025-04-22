<template>
  <div class="min-h-screen bg-gray-100">
    <nav v-if="!isLoginPage" class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-800">EEN Login</h1>
            </div>
            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                v-for="route in routes"
                :key="route.path"
                :to="route.path"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  $route.path === route.path
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                {{ route.name }}
              </router-link>
            </div>
          </div>
          <div class="flex items-center">
            <!-- Mobile menu button -->
            <div class="sm:hidden">
              <button
                @click="isMobileMenuOpen = !isMobileMenuOpen"
                class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-expanded="false"
              >
                <span class="sr-only">Open main menu</span>
                <!-- Icon when menu is closed -->
                <svg
                  v-if="!isMobileMenuOpen"
                  class="block h-6 w-6"
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
                <!-- Icon when menu is open -->
                <svg
                  v-else
                  class="block h-6 w-6"
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
            <!-- Desktop Logout Button -->
            <button
              v-if="isAuthenticated"
              @click="handleLogout"
              class="hidden sm:block ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div
        v-if="isMobileMenuOpen"
        class="sm:hidden"
      >
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            v-for="route in routes"
            :key="route.path"
            :to="route.path"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              $route.path === route.path
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            ]"
            @click="isMobileMenuOpen = false"
          >
            {{ route.name }}
          </router-link>
        </div>
        <!-- Mobile Logout Button -->
        <div v-if="isAuthenticated" class="pt-4 pb-3 border-t border-gray-200">
          <div class="px-4">
            <button
              @click="handleLogout"
              class="w-full flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const routes = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/settings', name: 'Settings' }
]

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isLoginPage = computed(() => route.path === '/')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
  isMobileMenuOpen.value = false
}
</script> 