<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Settings
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your application settings and preferences
          </p>
        </div>
        <div class="border-t border-gray-200">
          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900">API Configuration</h4>
                <div class="mt-4 text-sm text-gray-600">
                  <p>API Base URL: {{ authStore.httpsBaseUrl?.hostname || 'Not configured' }}</p>
                  <p class="mt-2">API Port: {{ authStore.httpsBaseUrl?.port || 'Not configured' }}</p>
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
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script> 