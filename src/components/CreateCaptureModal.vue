<template>
  <!-- Create New Capture Modal -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
    @click="handleModalBackdropClick"
  >
    <div 
      class="relative border w-full max-w-4xl shadow-2xl rounded-lg bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-scroll transform transition-all duration-300 scale-100"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="pb-4 border-b border-gray-200 dark:border-gray-600 p-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create New Capture
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
        
        <!-- User Email and Create Date in header row -->
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div class="text-left">
            <span class="text-gray-500 dark:text-gray-400">User: </span>
            <span class="text-blue-600 dark:text-blue-400 font-medium">{{ userEmail || 'No email available' }}</span>
          </div>
          <div></div> <!-- Empty div for spacing -->
          <div class="text-right">
            {{ new Date().toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-6">
        <form class="space-y-4" @submit.prevent="handleCreate">
          <!-- Capture Name (Editable) -->
          <div>
            <label for="capture-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              id="capture-name"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter capture name"
            />
          </div>

          <!-- Description (Editable) -->
          <div>
            <label for="capture-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="capture-description"
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter capture description (optional)"
            ></textarea>
          </div>

          <!-- Camera ID and Image Row -->
          <div class="flex flex-row items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <label for="camera-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Camera ID <span class="text-red-500">*</span>
                </label>
                <a 
                  href="https://webapp.eagleeyenetworks.com/#/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                >
                  <span>Find Cameras</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </div>
              <input
                id="camera-id"
                v-model="formData.cameraId"
                type="text"
                required
                maxlength="15"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{
                  'border-red-500': cameraError,
                  'border-green-500': cameraDetails && !cameraError
                }"
                placeholder="Enter camera ID (e.g., 100e93d0)"
              />
              <p v-if="cameraError" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ cameraError }}
              </p>
              <p v-if="cameraDetails" class="mt-1 text-sm text-green-600 dark:text-green-400">
                Camera found: {{ cameraDetails.name }}
              </p>
            </div>
            <div v-if="cameraDetails" class="w-40 flex-shrink-0 flex flex-col items-center">
              <div v-if="liveImageLoading" class="text-xs text-gray-500 dark:text-gray-400">Loading live image...</div>
              <div v-else-if="liveImageThumbnail" class="mt-1">
                <img :src="liveImageThumbnail" alt="Live camera preview" class="rounded border border-gray-300 dark:border-gray-600 max-w-full max-h-32" />
              </div>
              <div v-else-if="liveImageError" class="text-xs text-red-600 dark:text-red-400">{{ liveImageError }}</div>
            </div>
          </div>

          <!-- Start Date -->
          <div>
            <label for="start-date-picker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date & Time <span class="text-red-500">*</span>
            </label>
            
            <!-- Date/time picker -->
            <input
              id="start-date-picker"
              v-model="formData.startDate"
              type="datetime-local"
              required
              class="w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :class="{
                'border-red-500': timeRangeError,
                'border-gray-300 dark:border-gray-600': !timeRangeError
              }"
            />
            <p v-if="!timeRangeError" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              When to start the capture
            </p>
            <p v-if="timeRangeError" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ timeRangeError }}
            </p>
          </div>

          <!-- Duration and Interval in one row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Duration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration <span class="text-red-500">*</span>
              </label>
              <div class="flex space-x-2">
                <input
                  v-model.number="formData.duration.value"
                  type="number"
                  min="1"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="min-width: 60px;"
                  placeholder="60"
                />
                <select
                  v-model="formData.duration.unit"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="minutes">Min</option>
                  <option value="hours">Hr</option>
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How long to capture
              </p>
            </div>

            <!-- Interval -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval <span class="text-red-500">*</span>
              </label>
              <div class="flex space-x-2">
                <input
                  v-model.number="formData.interval.value"
                  type="number"
                  min="1"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="min-width: 60px;"
                  placeholder="30"
                />
                <select
                  v-model="formData.interval.unit"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="seconds">Sec</option>
                  <option value="minutes">Min</option>
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How often to capture
              </p>
            </div>
          </div>

          <!-- Image Count Display -->
          <div v-if="calculatedImageCount > 0" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Images
                </label>
                <div class="flex items-center space-x-2">
                  <span 
                    class="text-2xl font-bold"
                    :class="{
                      'text-green-600 dark:text-green-400': calculatedImageCount <= 1000,
                      'text-orange-600 dark:text-orange-400': calculatedImageCount > 1000 && calculatedImageCount <= 3000,
                      'text-red-600 dark:text-red-400': calculatedImageCount > 3000
                    }"
                  >
                    {{ calculatedImageCount.toLocaleString() }}
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">images</span>
                </div>
              </div>
              <div v-if="calculatedImageCount > 1000" class="text-right">
                <div 
                  class="text-xs px-2 py-1 rounded"
                  :class="{
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400': calculatedImageCount <= 3000,
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400': calculatedImageCount > 3000
                  }"
                >
                  {{ calculatedImageCount > 3000 ? 'EXCEEDS LIMIT' : 'LARGE SEQUENCE' }}
                </div>
              </div>
            </div>
            
            <!-- Warning message -->
            <div v-if="imageCountWarning" class="mt-2">
              <p 
                class="text-xs"
                :class="{
                  'text-orange-600 dark:text-orange-400': calculatedImageCount <= 3000,
                  'text-red-600 dark:text-red-400': calculatedImageCount > 3000
                }"
              >
                {{ imageCountWarning }}
              </p>
            </div>
          </div>

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
              class="px-4 py-2 rounded focus:outline-none focus:ring-2 transition-colors"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': isFormValid,
                'bg-gray-400 text-gray-200 cursor-not-allowed': !isFormValid
              }"
              :disabled="!isFormValid"
              @click="handleCreate"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { cameraService } from '../services/cameras'
import { mediaService } from '../services/media'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  userEmail: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'create'])

// Form data
const formData = ref({
  name: '',
  description: '',
  cameraId: '',
  startDate: '',
  duration: {
    value: 60,
    unit: 'minutes'
  },
  interval: {
    value: 30,
    unit: 'seconds'
  }
})

// Camera validation state
const cameraDetails = ref(null)
const cameraError = ref(null)
const liveImage = ref(null)
const liveImageLoading = ref(false)
const liveImageError = ref(null)
const liveImageThumbnail = ref(null)

// Image count calculation
const calculatedImageCount = ref(0)
const imageCountWarning = ref('')
const timeRangeError = ref('')

// Computed properties
const isFormValid = computed(() => {
  return formData.value.name.trim() && 
         formData.value.cameraId.trim() && 
         formData.value.startDate.trim() && 
         calculatedImageCount.value <= 3000 && 
         !timeRangeError.value
})

// Helper: Downsample image to 320px width and return base64
async function downsampleImage(base64Image, width = 320) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = function () {
      const scale = width / img.width
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = base64Image
  })
}

// Helper function to convert duration to milliseconds
function durationToMilliseconds(duration) {
  const { value, unit } = duration
  switch (unit) {
    case 'seconds':
      return value * 1000
    case 'minutes':
      return value * 60 * 1000
    case 'hours':
      return value * 60 * 60 * 1000
    default:
      return value * 60 * 1000 // default to minutes
  }
}

// Helper function to convert interval to milliseconds
function intervalToMilliseconds(interval) {
  const { value, unit } = interval
  switch (unit) {
    case 'seconds':
      return value * 1000
    case 'minutes':
      return value * 60 * 1000
    default:
      return value * 1000 // default to seconds
  }
}

// Calculate image count for create form
function calculateImageCount() {
  if (!formData.value.duration.value || !formData.value.interval.value) {
    calculatedImageCount.value = 0
    imageCountWarning.value = ''
    return
  }
  
  const durationMs = durationToMilliseconds(formData.value.duration)
  const intervalMs = intervalToMilliseconds(formData.value.interval)
  
  if (intervalMs <= 0) {
    calculatedImageCount.value = 0
    imageCountWarning.value = ''
    return
  }
  
  const count = Math.floor(durationMs / intervalMs) + 1 // +1 for the first image
  calculatedImageCount.value = count
  
  // Set warnings based on image count
  if (count > 3000) {
    imageCountWarning.value = 'Maximum 3000 images allowed. Please adjust duration or interval.'
  } else if (count > 1000) {
    imageCountWarning.value = 'Large sequence detected. This may take significant time to process.'
  } else {
    imageCountWarning.value = ''
  }
}

// Validate time range (start time + duration should not be in the future)
function validateTimeRange() {
  timeRangeError.value = ''
  
  if (!formData.value.startDate || !formData.value.duration.value) {
    return
  }
  
  try {
    const startTime = new Date(formData.value.startDate)
    const durationMs = durationToMilliseconds(formData.value.duration)
    const endTime = new Date(startTime.getTime() + durationMs)
    const now = new Date()
    
    if (endTime > now) {
      const timeDiff = endTime.getTime() - now.getTime()
      const hoursInFuture = Math.ceil(timeDiff / (1000 * 60 * 60))
      timeRangeError.value = `Capture end time is ${hoursInFuture} hour(s) in the future. Please adjust start time or duration.`
    }
  } catch (error) {
    console.warn('[Create Modal] Error validating time range:', error)
  }
}

// Reset form data
function resetForm() {
  formData.value = {
    name: '',
    description: '',
    cameraId: '',
    startDate: '',
    duration: {
      value: 60,
      unit: 'minutes'
    },
    interval: {
      value: 30,
      unit: 'seconds'
    }
  }
  
  // Reset camera state
  cameraDetails.value = null
  cameraError.value = null
  liveImage.value = null
  liveImageError.value = null
  liveImageThumbnail.value = null
  
  // Reset validation state
  calculatedImageCount.value = 0
  imageCountWarning.value = ''
  timeRangeError.value = ''
}

// Handle backdrop clicks
function handleModalBackdropClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// Handle create action
function handleCreate() {
  if (!isFormValid.value) return
  
  const captureData = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
    cameraId: formData.value.cameraId.trim(),
    startDate: formData.value.startDate.trim(),
    duration: {
      value: formData.value.duration.value,
      unit: formData.value.duration.unit
    },
    interval: {
      value: formData.value.interval.value,
      unit: formData.value.interval.unit
    },
    thumbnail: liveImageThumbnail.value || null
  }
  
  emit('create', captureData)
}

// Watch for camera ID changes
watch(() => formData.value.cameraId, async (newCameraId) => {
  cameraDetails.value = null
  cameraError.value = null
  liveImage.value = null
  liveImageError.value = null
  liveImageThumbnail.value = null
  
  if (!newCameraId || newCameraId.length < 3) {
    return
  }
  
  try {
    const details = await cameraService.getCameraById(newCameraId)
    cameraDetails.value = details
    cameraError.value = null
    // If the capture name is empty, set it to the camera name
    if (!formData.value.name.trim() && details.name) {
      formData.value.name = details.name
    }
    // Fetch live image after camera is confirmed
    liveImageLoading.value = true
    try {
      const result = await mediaService.getLiveImage(newCameraId)
      liveImage.value = result.image
      liveImageError.value = result.image ? null : 'Could not load live image.'
      if (result.image) {
        liveImageThumbnail.value = await downsampleImage(result.image, 320)
      }
    } catch {
      liveImage.value = null
      liveImageError.value = 'Could not load live image.'
      liveImageThumbnail.value = null
    } finally {
      liveImageLoading.value = false
    }
  } catch (error) {
    cameraDetails.value = null
    cameraError.value = error.message
    liveImage.value = null
    liveImageError.value = null
    liveImageThumbnail.value = null
  }
}, { debounce: 500 })

// Watch for duration and interval changes to recalculate image count
watch([
  () => formData.value.duration.value,
  () => formData.value.duration.unit,
  () => formData.value.interval.value,
  () => formData.value.interval.unit
], () => {
  calculateImageCount()
  validateTimeRange()
}, { immediate: true })

// Watch for start date changes to validate time range
watch(() => formData.value.startDate, () => {
  validateTimeRange()
})

// Watch for show prop to reset form when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

// ESC key handler for closing modal
const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.show) {
    emit('close')
  }
}

// Watch for show prop to add/remove ESC key listener
watch(() => props.show, (newShow) => {
  if (newShow) {
    // Add ESC key listener when modal opens
    document.addEventListener('keydown', handleEscapeKey)
  } else {
    // Remove ESC key listener when modal closes
    document.removeEventListener('keydown', handleEscapeKey)
  }
})

// Cleanup on component unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script> 