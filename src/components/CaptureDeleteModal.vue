<template>
  <!-- Delete Confirmation Modal -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
    @click="handleModalBackdropClick"
  >
    <div 
      class="relative border w-full max-w-md shadow-2xl rounded-lg bg-white dark:bg-gray-800 transform transition-all duration-300 scale-100"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Capture
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
      <div class="p-6">
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete this capture?
        </p>
        
        <div v-if="capture" class="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ capture.name || 'Unnamed Capture' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ capture.description || 'No description' }}
          </p>
        </div>

        <p class="text-xs text-red-600 dark:text-red-400 mb-4">
          This action cannot be undone.
        </p>

        <!-- Modal Footer -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button 
            type="button"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button 
            type="button"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            @click="$emit('delete', capture)"
          >
            Delete
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
const emit = defineEmits(['close', 'delete'])

// Handle backdrop clicks for modal
function handleModalBackdropClick(event) {
  // Only close if clicking the backdrop, not the modal content
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script> 