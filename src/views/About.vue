<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            About {{ APP_NAME }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            A secure authentication application for Eagle Eye Networks
          </p>
        </div>
        <div class="border-t border-gray-200">
          <div class="px-4 py-5 sm:p-6">
            <h4 class="text-base font-semibold text-gray-900 mb-4">Features</h4>
            <ul class="mt-2 text-sm text-gray-600 space-y-2">
              <li class="flex items-center">
                <svg class="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Secure OAuth2 authentication with Eagle Eye Networks
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="ml-3 text-sm text-gray-700">
                  Modern Vue 3 application with Composition API
                </p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="ml-3 text-sm text-gray-700">
                  Responsive design with Tailwind CSS
                </p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="ml-3 text-sm text-gray-700">
                  State management with Pinia
                </p>
              </li>
            </ul>
          </div>

          <div class="px-4 py-5 sm:p-6 border-t border-gray-200">
            <h4 class="text-md font-medium text-gray-900 mb-4">Technology Stack</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="text-sm font-medium text-gray-900">Frontend</h5>
                <ul class="mt-2 text-sm text-gray-600 space-y-1">
                  <li>Vue 3</li>
                  <li>Vite</li>
                  <li>Tailwind CSS</li>
                  <li>Pinia</li>
                  <li>Vue Router</li>
                </ul>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="text-sm font-medium text-gray-900">Authentication</h5>
                <ul class="mt-2 text-sm text-gray-600 space-y-1">
                  <li>OAuth2</li>
                  <li>Eagle Eye Networks API</li>
                  <li>Local Storage</li>
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
import { APP_NAME } from '../constants'
</script> 