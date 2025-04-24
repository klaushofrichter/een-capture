<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Settings</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Application settings and information</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Application Name</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ APP_NAME }}
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Version</dt>
              <dd
                class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center space-x-2"
              >
                <span>{{ APP_VERSION }}</span>
                <span class="text-gray-300">|</span>
                <a
                  href="https://github.com/klaushofrichter/een-login/blob/develop/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-400 hover:text-gray-600"
                  title="View README"
                >
                  README
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { APP_NAME, APP_VERSION } from '../constants'
</script>
