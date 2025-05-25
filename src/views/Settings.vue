<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Settings</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Configure your application preferences
          </p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700">
          <div class="px-4 py-5 sm:p-6">
            <div class="space-y-6">
              <!-- Theme Settings -->
              <div>
                <h4 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Theme</h4>
                <div class="flex items-center space-x-4">
                  <button
                    class="px-4 py-2 rounded-md text-sm font-medium"
                    :class="[
                      theme === 'light'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    ]"
                    @click="setTheme('light')"
                  >
                    Light
                  </button>
                  <button
                    class="px-4 py-2 rounded-md text-sm font-medium"
                    :class="[
                      theme === 'dark'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    ]"
                    @click="setTheme('dark')"
                  >
                    Dark
                  </button>
                  <button
                    class="px-4 py-2 rounded-md text-sm font-medium"
                    :class="[
                      theme === 'system'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    ]"
                    @click="setTheme('system')"
                  >
                    System
                  </button>
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
import { onMounted, computed } from 'vue'
import { useThemeStore } from '../stores/theme'
import { APP_NAME } from '../constants'

const themeStore = useThemeStore()
const theme = computed(() => themeStore.theme)

const setTheme = newTheme => {
  themeStore.setTheme(newTheme)
}

onMounted(() => {
  document.title = `${APP_NAME} - Settings`
})
</script>
