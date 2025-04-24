<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Welcome to {{ appName }}</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            You have successfully logged in to your Eagle Eye Networks account
          </p>
        </div>
        <div class="border-t border-gray-200">
          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900">Quick Links</h4>
                <ul class="mt-2 text-sm text-gray-600 space-y-2">
                  <li>
                    <router-link to="/settings" class="text-primary-600 hover:text-primary-500">
                      Settings
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/about" class="text-primary-600 hover:text-primary-500">
                      About
                    </router-link>
                  </li>
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

const authStore = useAuthStore()
const appName = computed(() => packageJson.displayName)

onMounted(() => {
  document.title = `${appName.value} - Home`
})
</script>
