<template>
  <!-- Capture Details Modal -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
    @click="handleModalBackdropClick"
  >
    <div 
      class="relative border w-full max-w-2xl shadow-2xl rounded-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-scroll transform transition-all duration-300 scale-100"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Capture Details
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="$emit('close')"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div v-if="capture" class="p-6">
        <div class="space-y-4">
          <!-- Thumbnail Preview -->
          <div v-if="capture.thumbnail" class="flex justify-center">
            <img :src="capture.thumbnail" alt="Thumbnail" class="rounded border border-gray-300 dark:border-gray-600 max-w-xs max-h-48" />
          </div>
          
          <!-- Capture Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ capture.name || 'Unnamed Capture' }}
            </p>
          </div>

          <!-- Start Date & Camera ID in one row -->
          <div v-if="capture.startDate || capture.cameraId" class="grid grid-cols-2 gap-4">
            <div v-if="capture.startDate">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date & Time
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ capture.startDate }}
              </p>
            </div>
            <div v-if="capture.cameraId">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Camera ID
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
                {{ capture.cameraId }}
              </p>
            </div>
          </div>

          <!-- Duration and Interval in one row -->
          <div v-if="capture.duration || capture.interval" class="grid grid-cols-2 gap-4">
            <!-- Duration -->
            <div v-if="capture.duration">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ capture.duration.value }} {{ capture.duration.unit }}
              </p>
            </div>
            <div v-else></div>

            <!-- Interval -->
            <div v-if="capture.interval">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capture Interval
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ capture.interval.value }} {{ capture.interval.unit }}
              </p>
            </div>
            <div v-else></div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Email
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ capture.eenUserEmailField || 'No email' }}
            </p>
          </div>

          <!-- Created Date -->
          <div v-if="capture.createdAt">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ new Date(capture.createdAt).toLocaleString() }}
            </p>
          </div>

          <!-- Description -->
          <div v-if="capture.description">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ capture.description }}
            </p>
          </div>

          <!-- Stored Images Summary -->
          <div v-if="capture.imageCount && capture.imageCount > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stored Images
            </label>
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ capture.imageCount }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">images stored</p>
                </div>
                <div v-if="capture.processedAt" class="text-right">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Processed:</p>
                  <p class="text-xs text-gray-600 dark:text-gray-300">{{ new Date(capture.processedAt).toLocaleString() }}</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Images stored in optimized database structure
              </p>
            </div>
          </div>

          <!-- Raw Data (for debugging) -->
          <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
            <details class="group">
              <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Raw Data (Debug)
              </summary>
              <pre class="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">{{ JSON.stringify(capture, null, 2) }}</pre>
            </details>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
          <div class="flex space-x-3">
            <button 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              @click="$emit('process', capture)"
            >
              Process
            </button>
            <button 
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              @click="$emit('delete', capture)"
            >
              Delete Capture
            </button>
          </div>
          <button 
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  capture: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'process', 'delete'])

// Handle backdrop clicks for modal
function handleModalBackdropClick(event) {
  // Only close if clicking the backdrop, not the modal content
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script> 