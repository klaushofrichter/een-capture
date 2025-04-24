<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="!isLoginPage" class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-primary-600">{{ APP_NAME }}</span>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/home"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/home'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                Home
              </router-link>
              <router-link
                to="/profile"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/profile'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                Profile
              </router-link>
              <router-link
                to="/about"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/about'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                About
              </router-link>
              <router-link
                to="/settings"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="[
                  route.path === '/settings'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Home
          </router-link>
          <router-link
            to="/profile"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/profile'
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Profile
          </router-link>
          <router-link
            to="/about"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/about'
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            About
          </router-link>
          <router-link
            to="/settings"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            :class="[
              route.path === '/settings'
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Settings
          </router-link>
          <button
            @click="handleLogout"
            class="w-full text-left border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { APP_NAME } from './constants'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const isLoginPage = computed(() => route.path === '/')

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
