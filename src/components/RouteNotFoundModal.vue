<template>
  <div v-if="notificationStore.showRouteNotFoundModal" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>

      <!-- Modal panel -->
      <div
        class="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
      >
        <div>
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg
              class="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              Page Not Found
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                The page <span class="font-semibold">{{ notificationStore.invalidPath }}</span> does
                not exist.
              </p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6">
          <button
            type="button"
            class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            @click="notificationStore.closeRouteNotFoundModal"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()
</script>
