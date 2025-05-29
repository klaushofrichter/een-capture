<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Capture
          </h3>
          <div class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            <p class="md:flex md:justify-between md:items-center">
              <span>Capture and manage your content</span>
              <span v-if="eenAuthStore.userProfile?.email" class="block md:inline mt-1 md:mt-0">
                <span class="text-gray-500 dark:text-gray-400">User: </span>
                <span class="text-blue-600 dark:text-blue-400 font-medium">{{ eenAuthStore.userProfile.email }}</span>
              </span>
            </p>
          </div>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700">
          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Capture Tools</h4>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Welcome to the Capture page. This is where you can manage your content captures.
                </p>
                
                <!-- Create New Capture button -->
                <div class="mt-4">
                  <button 
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
                    :disabled="loading"
                    @click="openCreateModal"
                  >
                    Create New Capture
                  </button>
                </div>
                
                <!-- Display fetched data -->
                <div v-if="loading" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Loading captures...
                </div>
                <div v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">
                  Error loading captures: {{ error }}
                </div>
                <ul v-if="!loading && !error && captures.length > 0" class="mt-4 space-y-2">
                  <li 
                    v-for="capture in captures" 
                    :key="capture.id" 
                    class="p-2 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex items-center gap-3"
                  >
                    <div v-if="capture.thumbnail" class="flex-shrink-0">
                      <img :src="capture.thumbnail" alt="Thumbnail" class="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600" />
                    </div>
                    <div class="flex-1 cursor-pointer" @click="openCaptureModal(capture)">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ capture.name || 'Unnamed Capture' }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ capture.eenUserEmailField || 'No email' }}</p>
                      <p v-if="capture.createdAt" class="text-xs text-gray-500 dark:text-gray-400">
                        Created: {{ new Date(capture.createdAt).toLocaleString() }}
                      </p>
                      <p v-if="capture.images && capture.images.length > 0" class="text-xs text-green-600 dark:text-green-400">
                        📁 {{ capture.images.length }} images stored
                      </p>
                    </div>
                    <!-- Action buttons: Process and Delete -->
                    <div class="flex items-center gap-2 ml-2">
                      <button 
                        class="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        @click.stop="openProcessModal(capture)"
                      >
                        Process
                      </button>
                      <button 
                        class="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        @click.stop="openDeleteModal(capture)"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                </ul>
                <p v-if="!loading && !error && captures.length === 0" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  No captures available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create New Capture Modal -->
  <div 
    v-if="showCreateModal" 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeCreateModal"
  >
    <div 
      class="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 2xl:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="pb-4 border-b border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create New Capture
          </h3>
          <button 
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            @click="closeCreateModal"
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
            <span class="text-blue-600 dark:text-blue-400 font-medium">{{ eenAuthStore.userProfile?.email || 'No email available' }}</span>
          </div>
          <div></div> <!-- Empty div for spacing -->
          <div class="text-right">
            {{ new Date().toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="pt-4">
        <form class="space-y-4" @submit.prevent="createCapture">
          <!-- Capture Name (Editable) -->
          <div>
            <label for="capture-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              id="capture-name"
              v-model="createForm.name"
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
              v-model="createForm.description"
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
                  class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  Find Cameras
                </a>
              </div>
              <input
                id="camera-id"
                v-model="createForm.cameraId"
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
              v-model="createForm.startDate"
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
                  v-model.number="createForm.duration.value"
                  type="number"
                  min="1"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="min-width: 60px;"
                  placeholder="60"
                />
                <select
                  v-model="createForm.duration.unit"
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
                  v-model.number="createForm.interval.value"
                  type="number"
                  min="1"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="min-width: 60px;"
                  placeholder="30"
                />
                <select
                  v-model="createForm.interval.unit"
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
              @click="closeCreateModal"
            >
              Cancel
            </button>
            <button 
              type="button"
              class="px-4 py-2 rounded focus:outline-none focus:ring-2 transition-colors"
              :class="{
                'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': createForm.name.trim() && createForm.cameraId.trim() && createForm.startDate.trim() && calculatedImageCount <= 3000 && !timeRangeError,
                'bg-gray-400 text-gray-200 cursor-not-allowed': !createForm.name.trim() || !createForm.cameraId.trim() || !createForm.startDate.trim() || calculatedImageCount > 3000 || timeRangeError
              }"
              @click="createCapture"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Capture Details Modal -->
  <div 
    v-if="showModal" 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeCaptureModal"
  >
    <div 
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/5 xl:w-1/2 2xl:w-2/5 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Capture Details
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          @click="closeCaptureModal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div v-if="selectedCapture" class="pt-4">
        <div class="space-y-4">
          <!-- Thumbnail Preview -->
          <div v-if="selectedCapture.thumbnail" class="flex justify-center">
            <img :src="selectedCapture.thumbnail" alt="Thumbnail" class="rounded border border-gray-300 dark:border-gray-600 max-w-xs max-h-48" />
          </div>
          <!-- Capture Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ selectedCapture.name || 'Unnamed Capture' }}
            </p>
          </div>

          <!-- Start Date & Camera ID in one row -->
          <div v-if="selectedCapture.startDate || selectedCapture.cameraId" class="grid grid-cols-2 gap-4">
            <div v-if="selectedCapture.startDate">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date & Time
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ selectedCapture.startDate }}
              </p>
            </div>
            <div v-if="selectedCapture.cameraId">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Camera ID
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
                {{ selectedCapture.cameraId }}
              </p>
            </div>
          </div>

          <!-- Duration and Interval in one row -->
          <div v-if="selectedCapture.duration || selectedCapture.interval" class="grid grid-cols-2 gap-4">
            <!-- Duration -->
            <div v-if="selectedCapture.duration">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ selectedCapture.duration.value }} {{ selectedCapture.duration.unit }}
              </p>
            </div>
            <div v-else></div>

            <!-- Interval -->
            <div v-if="selectedCapture.interval">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capture Interval
              </label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {{ selectedCapture.interval.value }} {{ selectedCapture.interval.unit }}
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
              {{ selectedCapture.eenUserEmailField || 'No email' }}
            </p>
          </div>

          <!-- Created Date -->
          <div v-if="selectedCapture.createdAt">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ new Date(selectedCapture.createdAt).toLocaleString() }}
            </p>
          </div>

          <!-- Description -->
          <div v-if="selectedCapture.description">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ selectedCapture.description }}
            </p>
          </div>

          <!-- Stored Images -->
          <div v-if="selectedCapture.images && selectedCapture.images.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stored Images ({{ selectedCapture.images.length }})
            </label>
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                <div 
                  v-for="(image, index) in selectedCapture.images" 
                  :key="index"
                  class="relative group"
                >
                  <img 
                    :src="image.downloadUrl" 
                    :alt="`Stored image ${image.index}`"
                    class="w-full h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                    @error="$event.target.style.display='none'"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <span class="text-white text-xs font-bold">{{ image.index }}</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Images stored in Firebase Cloud Storage
              </p>
            </div>
          </div>

          <!-- Raw Data (for debugging) -->
          <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
            <details class="group">
              <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Raw Data (Debug)
              </summary>
              <pre class="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">{{ JSON.stringify(selectedCapture, null, 2) }}</pre>
            </details>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
          <button 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            @click="openDeleteModal(selectedCapture); closeCaptureModal()"
          >
            Delete Capture
          </button>
          <button 
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            @click="closeCaptureModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div 
    v-if="showDeleteModal" 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeDeleteModal"
  >
    <div 
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/5 lg:w-2/5 xl:w-1/3 2xl:w-1/4 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Capture
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          @click="closeDeleteModal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="pt-4">
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete this capture?
        </p>
        
        <div v-if="captureToDelete" class="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ captureToDelete.name || 'Unnamed Capture' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ captureToDelete.description || 'No description' }}
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
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button 
            type="button"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            @click="deleteCapture"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Process Modal -->
  <div 
    v-if="showProcessModal" 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeProcessModal"
  >
    <div 
      class="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 2xl:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <div class="pb-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Process Capture</h3>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          :disabled="isProcessing"
          @click="closeProcessModal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="pt-4 space-y-4">
        <!-- Title (full width) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">{{ processCapture?.name || 'Unnamed Capture' }}</p>
        </div>

        <!-- Camera ID and Thumbnail Row -->
        <div class="flex gap-4">
          <!-- Left side: Camera ID -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camera ID</label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">{{ processCapture?.cameraId }}</p>
          </div>
          
          <!-- Right side: Thumbnail -->
          <div v-if="processCapture?.thumbnail" class="flex-shrink-0">
            <img :src="processCapture.thumbnail" alt="Thumbnail" class="rounded border border-gray-300 dark:border-gray-600 max-w-32 max-h-32 object-contain" />
          </div>
        </div>

        <!-- Start Date, Duration, and Interval Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">{{ processCapture?.startDate }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ processCapture?.duration?.value }} {{ processCapture?.duration?.unit }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interval</label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ processCapture?.interval?.value }} {{ processCapture?.interval?.unit }}
            </p>
          </div>
        </div>

        <!-- Image Count and Timestamps -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Capture Plan</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Total Images</label>
              <p class="text-lg font-bold text-blue-900 dark:text-blue-100">{{ processImageCount }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">First 5 Timestamps</label>
              <div class="space-y-1">
                <p 
                  v-for="(timestamp, index) in processTimestamps.slice(0, 5)" 
                  :key="index"
                  class="text-xs text-blue-800 dark:text-blue-200 font-mono"
                >
                  {{ new Date(timestamp).toLocaleString() }}
                </p>
                <p v-if="processTimestamps.length > 5" class="text-xs text-blue-600 dark:text-blue-400 italic">
                  ... and {{ processTimestamps.length - 5 }} more
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Progress -->
        <div v-if="isProcessing" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-green-900 dark:text-green-100 mb-2">Processing Images</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-green-700 dark:text-green-300">
              <span>Progress: {{ processedImages.length }} / {{ processImageCount }}</span>
              <span>{{ processProgress }}%</span>
            </div>
            <div class="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
              <div 
                class="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                :style="{ width: processProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Processing Results -->
        <div v-if="processedImages.length > 0 && !isProcessing" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Captured Images ({{ processedImages.length }})
          </h4>
          <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
            <div 
              v-for="processedImage in processedImages" 
              :key="processedImage.index"
              class="relative group"
            >
              <img 
                :src="processedImage.image" 
                :alt="`Image ${processedImage.index}`"
                class="w-full h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
              />
              <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ processedImage.index }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Progress (Integrated with Capture) -->
        <div v-if="isUploading" class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Uploading to Firebase Storage</h4>
          
          <div class="space-y-3">
            <div class="flex justify-between text-sm text-purple-700 dark:text-purple-300">
              <span>Capturing and uploading images...</span>
              <span>{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div 
                class="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-300"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
            
            <!-- Real-time upload statistics for large sequences -->
            <div v-if="uploadStats.total > 100" class="grid grid-cols-3 gap-4 text-xs">
              <div class="text-center">
                <div class="text-green-600 dark:text-green-400 font-bold">{{ uploadStats.success }}</div>
                <div class="text-gray-500 dark:text-gray-400">Uploaded</div>
              </div>
              <div class="text-center">
                <div class="text-red-600 dark:text-red-400 font-bold">{{ uploadStats.failed }}</div>
                <div class="text-gray-500 dark:text-gray-400">Failed</div>
              </div>
              <div class="text-center">
                <div class="text-purple-600 dark:text-purple-400 font-bold">{{ uploadStats.total - uploadStats.success - uploadStats.failed }}</div>
                <div class="text-gray-500 dark:text-gray-400">Pending</div>
              </div>
            </div>
            
            <!-- Parallel processing indicator -->
            <div class="text-xs text-purple-600 dark:text-purple-400 text-center">
              Using parallel capture and upload for optimal performance
            </div>
          </div>
        </div>
        
        <!-- Completion Summary -->
        <div v-if="!isProcessing && !isUploading && uploadStats.total > 0" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-green-900 dark:text-green-100 mb-2">Process Complete</h4>
          <div class="text-sm text-green-700 dark:text-green-300">
            Successfully captured and uploaded {{ uploadStats.success }}/{{ uploadStats.total }} images
            <span v-if="uploadStats.failed > 0" class="text-red-600 dark:text-red-400">
              ({{ uploadStats.failed }} failed)
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600 mt-6 space-x-3">
        <button 
          class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          :disabled="isProcessing || isUploading"
          @click="closeProcessModal"
        >
          {{ isProcessing || isUploading ? 'Processing...' : 'Close' }}
        </button>
        <button 
          v-if="!isProcessing && !isUploading && uploadStats.total === 0"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          @click="startImageCapture"
        >
          Start Capture & Upload
        </button>
        <button 
          v-else-if="isProcessing || isUploading"
          class="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
          disabled
        >
          <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>{{ isProcessing && isUploading ? 'Capturing & Uploading...' : isProcessing ? 'Processing...' : 'Uploading...' }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>

  <!-- Re-process Confirmation Modal -->
  <div 
    v-if="showReprocessModal" 
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeReprocessModal"
  >
    <div 
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/5 lg:w-2/5 xl:w-1/3 2xl:w-1/4 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Re-process Capture
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          @click="closeReprocessModal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="pt-4">
        <div class="mb-4">
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Existing Images Found
              </h4>
            </div>
          </div>
          
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
            This capture already has <strong>{{ reprocessCapture?.images?.length || 0 }} stored images</strong>. 
            Re-processing will permanently delete all existing images and capture new ones.
          </p>
          
          <div v-if="reprocessCapture" class="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {{ reprocessCapture.name || 'Unnamed Capture' }}
            </p>
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Camera: {{ reprocessCapture.cameraId }}</p>
              <p>Duration: {{ reprocessCapture.duration?.value }} {{ reprocessCapture.duration?.unit }}</p>
              <p>Interval: {{ reprocessCapture.interval?.value }} {{ reprocessCapture.interval?.unit }}</p>
              <p v-if="reprocessCapture.processedAt" class="text-green-600 dark:text-green-400">
                Last processed: {{ new Date(reprocessCapture.processedAt).toLocaleString() }}
              </p>
            </div>
          </div>

          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <h5 class="text-sm font-medium text-red-800 dark:text-red-400">
                  Warning: This action cannot be undone
                </h5>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                  All {{ reprocessCapture?.images?.length || 0 }} existing images will be permanently deleted from Firebase Storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button 
            type="button"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            @click="closeReprocessModal"
          >
            Cancel
          </button>
          <button 
            type="button"
            class="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            @click="confirmReprocess"
          >
            Delete & Re-process
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore as useEenAuthStore } from '../stores/auth'
import { APP_NAME } from '../constants'
import { getFirestore, collection, getDocs, query, where, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { firebaseAuthService } from '../services/firebase-auth'
import app from '../firebase'
import { cameraService } from '../services/cameras'
import { mediaService } from '../services/media'
import securityService from '@/services/security'

const eenAuthStore = useEenAuthStore()
const captures = ref([]);
const loading = ref(true);
const error = ref(null);

// Modal state
const showModal = ref(false);
const selectedCapture = ref(null);

// Create modal state
const showCreateModal = ref(false);
const createForm = ref({
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
});
const cameraDetails = ref(null);
const cameraError = ref(null);
const liveImage = ref(null);
const liveImageLoading = ref(false);
const liveImageError = ref(null);
const liveImageThumbnail = ref(null);

// Image count calculation for create modal
const calculatedImageCount = ref(0);
const imageCountWarning = ref('');
const timeRangeError = ref('');

// Delete modal state
const showDeleteModal = ref(false);
const captureToDelete = ref(null);

// Add modal state for process modal
const showProcessModal = ref(false);
const processCapture = ref(null);

// Re-process confirmation modal state
const showReprocessModal = ref(false);
const reprocessCapture = ref(null);

// Process modal state
const processImageCount = ref(0);
const processTimestamps = ref([]);
const isProcessing = ref(false);
const processProgress = ref(0);
const processedImages = ref([]);

// Upload state
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadedImages = ref([]);
const showUploadSection = ref(false);

// Streaming upload state for large sequences
const streamingResults = ref([]);
const uploadStats = ref({ success: 0, failed: 0, total: 0 });

// Helper: Downsample image to 320px width and return base64
async function downsampleImage(base64Image, width = 320) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const scale = width / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

const fetchCaptures = async () => {
  loading.value = true;
  error.value = null;
  
  const eenUserIdentifier = eenAuthStore?.userProfile?.email;
  if (!eenUserIdentifier) {
    error.value = "EEN user details not available.";
    loading.value = false;
    return;
  }

  // Ensure Firebase auth is ready
  if (!firebaseAuthService.isAuthenticated()) {
    error.value = "Firebase authentication required.";
    loading.value = false;
    return;
  }

  try {
    const db = getFirestore(app);
    console.log("[Capture.vue] Firestore instance:", db);
    console.log("[Capture.vue] EEN User Identifier:", eenUserIdentifier);
       
    // query for the specific user 
    console.log("[Capture.vue] Trying specific query with eenUserEmailField ==", eenUserIdentifier);
    const q = query(collection(db, "captures"), where("eenUserEmailField", "==", eenUserIdentifier));
    const querySnapshot = await getDocs(q);
    
    console.log("[Capture.vue] Specific query returned:", querySnapshot.size, "documents");
    captures.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log("Captures fetched successfully:", captures.value);
    if (captures.value.length === 0) {
      console.log("No captures matched for this EEN user.", eenUserIdentifier);
      // For debugging, let's also try to show all captures
      //const allCaptures = allCapturesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      //console.log("All captures in collection (for debugging):", allCaptures);
      
      // Temporarily show all captures in UI for debugging
      //captures.value = allCaptures;
    }
  } catch (e) {
    console.error("Error fetching captures: ", e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const ensureUserProfile = async () => {
  console.log("[Capture.vue] Ensuring user profile is available");
  
  if (eenAuthStore.userProfile) {
    console.log("[Capture.vue] User profile already available:", eenAuthStore.userProfile);
    return;
  }
  
  if (!eenAuthStore.baseUrl || !eenAuthStore.token) {
    throw new Error('EEN authentication required');
  }
  
  console.log("[Capture.vue] Fetching user profile...");
  try {
    // Import userService dynamically to avoid circular dependencies
    const { userService } = await import('../services/user');
    const data = await userService.getUserProfile();
    eenAuthStore.setUserProfile({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    });
    console.log("[Capture.vue] User profile fetched successfully:", eenAuthStore.userProfile);
  } catch (err) {
    console.error("[Capture.vue] Error fetching user profile:", err);
    throw new Error(`Failed to fetch user profile: ${err.message}`);
  }
};

const signInAndFetchData = async () => {
  console.log("[Capture.vue] Starting Firebase authentication with EEN credentials");
  loading.value = true;
  error.value = null;

  try {
    // Ensure user profile is available before attempting Firebase auth
    await ensureUserProfile();
    
    // Check if we need to refresh the EEN token
    const timeRemaining = eenAuthStore.getTokenTimeRemaining();
    if (timeRemaining && timeRemaining < 300000) { // 5 minutes
      console.log("[Capture.vue] EEN token expiring soon, refreshing...");
      const { refreshToken } = await import('../services/auth');
      await refreshToken();
    }
    
    // Sign in to Firebase using EEN custom token
    const firebaseUser = await firebaseAuthService.signInWithEEN();
    console.log("[Capture.vue] Firebase authentication successful:", firebaseUser.uid);
    
    // Fetch captures for the authenticated user
    await fetchCaptures();
  } catch (signInError) {
    console.error("[Capture.vue] Firebase authentication error:", signInError);
    error.value = `Firebase authentication failed: ${signInError.message}`;
    loading.value = false;
  }
};

const createCapture = async () => {
  console.log("[Capture.vue] Creating new capture...");
  console.log("[Capture.vue] Form data:", createForm.value);
  console.log("[Capture.vue] Calculated image count:", calculatedImageCount.value);
  console.log("[Capture.vue] Time range error:", timeRangeError.value);
  
  if (!firebaseAuthService.isAuthenticated()) {
    console.error("[Capture.vue] User must be authenticated to create capture");
    return;
  }
  console.log("[Capture.vue] ✅ Firebase authentication check passed");

  const eenUserEmail = eenAuthStore?.userProfile?.email;
  if (!eenUserEmail) {
    console.error("[Capture.vue] EEN user email not available");
    return;
  }
  console.log("[Capture.vue] ✅ EEN user email check passed:", eenUserEmail);

  // Validate form
  if (!createForm.value.name.trim()) {
    console.error("[Capture.vue] Capture name is required");
    return;
  }
  console.log("[Capture.vue] ✅ Name validation passed");
  
  if (!createForm.value.cameraId.trim()) {
    console.error("[Capture.vue] Camera ID is required");
    return;
  }
  console.log("[Capture.vue] ✅ Camera ID validation passed");
  
  if (!createForm.value.startDate.trim()) {
    console.error("[Capture.vue] Start date is required");
    return;
  }
  console.log("[Capture.vue] ✅ Start date validation passed");
  
  // Validate image count
  if (calculatedImageCount.value > 3000) {
    console.error("[Capture.vue] Image count exceeds maximum of 3000");
    return;
  }
  console.log("[Capture.vue] ✅ Image count validation passed");
  
  // Validate time range
  if (timeRangeError.value) {
    console.error("[Capture.vue] Time range validation failed:", timeRangeError.value);
    return;
  }
  console.log("[Capture.vue] ✅ Time range validation passed");

  try {
    const db = getFirestore(app);
    const newCapture = {
      name: createForm.value.name.trim(),
      description: createForm.value.description.trim(),
      cameraId: createForm.value.cameraId.trim(),
      startDate: createForm.value.startDate.trim(),
      duration: {
        value: createForm.value.duration.value,
        unit: createForm.value.duration.unit
      },
      interval: {
        value: createForm.value.interval.value,
        unit: createForm.value.interval.unit
      },
      eenUserEmailField: eenUserEmail,
      createdAt: new Date().toISOString(),
      thumbnail: liveImageThumbnail.value || null
    };

    console.log("[Capture.vue] Creating capture:", newCapture);
    const docRef = await addDoc(collection(db, "captures"), newCapture);
    console.log("[Capture.vue] Capture created with ID:", docRef.id);
    
    // Close modal and refresh the captures list
    closeCreateModal();
    await fetchCaptures();
  } catch (error) {
    console.error("[Capture.vue] Error creating capture:", error);
  }
};

// Open modal with selected capture
const openCaptureModal = (capture) => {
  console.log("[Capture.vue] Opening modal for capture:", capture);
  selectedCapture.value = capture;
  showModal.value = true;
};

// Close modal
const closeCaptureModal = () => {
  console.log("[Capture.vue] Closing capture modal");
  showModal.value = false;
  selectedCapture.value = null;
};

// Open create modal
const openCreateModal = () => {
  console.log("[Capture.vue] Opening create capture modal");
  createForm.value = {
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
  };
  showCreateModal.value = true;
};

// Close create modal
const closeCreateModal = () => {
  console.log("[Capture.vue] Closing create capture modal");
  showCreateModal.value = false;
  createForm.value = {
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
  };
  // Reset image count calculation and time validation
  calculatedImageCount.value = 0;
  imageCountWarning.value = '';
  timeRangeError.value = '';
};

// Open delete confirmation modal
const openDeleteModal = (capture) => {
  console.log("[Capture.vue] Opening delete confirmation for capture:", capture);
  captureToDelete.value = capture;
  showDeleteModal.value = true;
};

// Close delete confirmation modal
const closeDeleteModal = () => {
  console.log("[Capture.vue] Closing delete confirmation modal");
  showDeleteModal.value = false;
  captureToDelete.value = null;
};

// Delete capture
const deleteCapture = async () => {
  console.log("[Capture.vue] Deleting capture:", captureToDelete.value);
  
  if (!captureToDelete.value) {
    console.error("[Capture.vue] No capture selected for deletion");
    return;
  }

  try {
    const captureId = captureToDelete.value.id;
    
    // Delete images from Firebase Storage first
    try {
      await storageService.deleteCapture(captureId);
      console.log("[Capture.vue] Storage images deleted successfully");
    } catch (storageError) {
      console.warn("[Capture.vue] Error deleting storage images (continuing with Firestore deletion):", storageError);
    }
    
    // Delete the capture document from Firestore
    const db = getFirestore(app);
    await deleteDoc(doc(db, "captures", captureId));
    console.log("[Capture.vue] Capture deleted successfully");
    
    // Close delete modal and refresh the captures list
    closeDeleteModal();
    await fetchCaptures();
  } catch (error) {
    console.error("[Capture.vue] Error deleting capture:", error);
  }
};

// ESC key handler for closing modals
const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    // Close whichever modal is currently open (but not if processing)
    if (showDeleteModal.value) {
      closeDeleteModal();
    } else if (showReprocessModal.value) {
      closeReprocessModal();
    } else if (showCreateModal.value) {
      closeCreateModal();
    } else if (showModal.value) {
      closeCaptureModal();
    } else if (showProcessModal.value && !isProcessing.value && !isUploading.value) {
      closeProcessModal();
    }
  }
};

// Watch for modal state changes to add/remove ESC key listener
watch([showModal, showCreateModal, showDeleteModal, showProcessModal, showReprocessModal], ([modal, createModal, deleteModal, processModal, reprocessModal]) => {
  const anyModalOpen = modal || createModal || deleteModal || processModal || reprocessModal;
  
  if (anyModalOpen) {
    // Add ESC key listener when any modal opens
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    // Remove ESC key listener when all modals are closed
    document.removeEventListener('keydown', handleEscapeKey);
  }
}, { immediate: true });

// Add token refresh interval
let tokenRefreshInterval = null;

// Watch for camera ID changes
watch(() => createForm.value.cameraId, async (newCameraId) => {
  cameraDetails.value = null;
  cameraError.value = null;
  liveImage.value = null;
  liveImageError.value = null;
  liveImageThumbnail.value = null;
  
  if (!newCameraId || newCameraId.length < 3) {
    return;
  }
  
  try {
    const details = await cameraService.getCameraById(newCameraId);
    cameraDetails.value = details;
    cameraError.value = null;
    // If the capture name is empty, set it to the camera name
    if (!createForm.value.name.trim() && details.name) {
      createForm.value.name = details.name;
    }
    // Fetch live image after camera is confirmed
    liveImageLoading.value = true;
    try {
      const result = await mediaService.getLiveImage(newCameraId);
      liveImage.value = result.image;
      liveImageError.value = result.image ? null : 'Could not load live image.';
      if (result.image) {
        liveImageThumbnail.value = await downsampleImage(result.image, 320);
      }
    } catch {
      liveImage.value = null;
      liveImageError.value = 'Could not load live image.';
      liveImageThumbnail.value = null;
    } finally {
      liveImageLoading.value = false;
    }
  } catch (error) {
    cameraDetails.value = null;
    cameraError.value = error.message;
    liveImage.value = null;
    liveImageError.value = null;
    liveImageThumbnail.value = null;
  }
}, { debounce: 500 });

// Watch for duration and interval changes to recalculate image count
watch([
  () => createForm.value.duration.value,
  () => createForm.value.duration.unit,
  () => createForm.value.interval.value,
  () => createForm.value.interval.unit
], () => {
  calculateImageCount();
  validateTimeRange();
}, { immediate: true });

// Watch for start date changes to validate time range
watch(() => createForm.value.startDate, () => {
  validateTimeRange();
});

// Helper function to convert duration to milliseconds
function durationToMilliseconds(duration) {
  const { value, unit } = duration;
  switch (unit) {
    case 'seconds':
      return value * 1000;
    case 'minutes':
      return value * 60 * 1000;
    case 'hours':
      return value * 60 * 60 * 1000;
    default:
      return value * 60 * 1000; // default to minutes
  }
}

// Helper function to convert interval to milliseconds
function intervalToMilliseconds(interval) {
  const { value, unit } = interval;
  switch (unit) {
    case 'seconds':
      return value * 1000;
    case 'minutes':
      return value * 60 * 1000;
    default:
      return value * 1000; // default to seconds
  }
}

// Calculate image count for create form
function calculateImageCount() {
  if (!createForm.value.duration.value || !createForm.value.interval.value) {
    calculatedImageCount.value = 0;
    imageCountWarning.value = '';
    return;
  }
  
  const durationMs = durationToMilliseconds(createForm.value.duration);
  const intervalMs = intervalToMilliseconds(createForm.value.interval);
  
  if (intervalMs <= 0) {
    calculatedImageCount.value = 0;
    imageCountWarning.value = '';
    return;
  }
  
  const count = Math.floor(durationMs / intervalMs) + 1; // +1 for the first image
  calculatedImageCount.value = count;
  
  // Set warnings based on image count
  if (count > 3000) {
    imageCountWarning.value = 'Maximum 3000 images allowed. Please adjust duration or interval.';
  } else if (count > 1000) {
    imageCountWarning.value = 'Large sequence detected. This may take significant time to process.';
  } else {
    imageCountWarning.value = '';
  }
}

// Validate time range (start time + duration should not be in the future)
function validateTimeRange() {
  timeRangeError.value = '';
  
  if (!createForm.value.startDate || !createForm.value.duration.value) {
    return;
  }
  
  try {
    const startTime = new Date(createForm.value.startDate);
    const durationMs = durationToMilliseconds(createForm.value.duration);
    const endTime = new Date(startTime.getTime() + durationMs);
    const now = new Date();
    
    if (endTime > now) {
      const timeDiff = endTime.getTime() - now.getTime();
      const hoursInFuture = Math.ceil(timeDiff / (1000 * 60 * 60));
      timeRangeError.value = `Capture end time is ${hoursInFuture} hour(s) in the future. Please adjust start time or duration.`;
    }
  } catch (error) {
    console.warn('[Create Modal] Error validating time range:', error);
  }
}

// Calculate timestamps for image capture
function calculateCaptureTimestamps(capture) {
  const startTime = new Date(capture.startDate).getTime();
  const durationMs = durationToMilliseconds(capture.duration);
  const intervalMs = intervalToMilliseconds(capture.interval);
  
  const endTime = startTime + durationMs;
  const timestamps = [];
  
  for (let currentTime = startTime; currentTime <= endTime; currentTime += intervalMs) {
    // Format timestamp as YYYY-MM-DDTHH:mm:ss.sss+00:00 (ISO 8601 format with +00:00 instead of Z)
    const date = new Date(currentTime);
    const timestamp = date.toISOString().replace('Z', '+00:00');
    timestamps.push(timestamp);
  }
  
  console.log(`[Process] Generated ${timestamps.length} timestamps. First few:`, timestamps.slice(0, 3));
  return timestamps;
}

// Start the image capture and upload process (streamlined)
async function startImageCapture() {
  if (!processCapture.value) return;
  
  isProcessing.value = true;
  processProgress.value = 0;
  processedImages.value = [];
  
  // Initialize upload state immediately
  isUploading.value = true;
  uploadProgress.value = 0;
  uploadedImages.value = [];
  streamingResults.value = [];
  uploadStats.value = { success: 0, failed: 0, total: processTimestamps.value.length };
  
  const timestamps = processTimestamps.value;
  const totalImages = timestamps.length;
  const captureId = processCapture.value.id;
  
  console.log(`[Process] Starting streamlined capture and upload of ${totalImages} images from camera ${processCapture.value.cameraId}`);
  
  // For large sequences (>500 images), use memory-efficient processing
  const isLargeSequence = totalImages > 500;
  const batchSize = isLargeSequence ? 10 : totalImages; // Process in batches for large sequences
  
  if (isLargeSequence) {
    console.log(`[Process] Large sequence detected (${totalImages} images). Using streamlined batch processing with size ${batchSize}`);
  }
  
  for (let batchStart = 0; batchStart < timestamps.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, timestamps.length);
    const batchTimestamps = timestamps.slice(batchStart, batchEnd);
    
    console.log(`[Process] Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(timestamps.length / batchSize)} (images ${batchStart + 1}-${batchEnd})`);
    
    // Process batch with parallel requests (max 3 concurrent for API stability)
    const batchPromises = [];
    const maxConcurrent = 3;
    
    for (let i = 0; i < batchTimestamps.length; i += maxConcurrent) {
      const concurrentBatch = batchTimestamps.slice(i, i + maxConcurrent);
      const concurrentPromises = concurrentBatch.map(async (timestamp, concurrentIndex) => {
        const globalIndex = batchStart + i + concurrentIndex + 1;
        
        try {
          console.log(`[Process] Capturing and uploading image ${globalIndex}/${totalImages} at ${timestamp}`);
          
          // Step 1: Capture the image
          const result = await mediaService.getRecordedImage(
            processCapture.value.cameraId,
            timestamp,
            'preview'
          );
          
          if (result.image) {
            // Step 2: Immediately upload to Firebase Storage
            try {
              const uploadResult = await storageService.uploadImage(
                captureId,
                globalIndex,
                result.image,
                timestamp
              );
              
              const finalResult = {
                timestamp,
                image: result.image, // Keep for UI display
                index: globalIndex,
                downloadUrl: uploadResult.downloadUrl,
                storagePath: uploadResult.storagePath,
                size: uploadResult.size,
                success: true
              };
              
              // Update upload statistics
              uploadStats.value.success++;
              streamingResults.value.push(finalResult);
              
              // Update upload progress
              const totalCompleted = uploadStats.value.success + uploadStats.value.failed;
              uploadProgress.value = Math.round((totalCompleted / totalImages) * 100);
              
              // Batch update Firestore every 10 uploads
              if (streamingResults.value.length % 10 === 0) {
                updateCaptureWithImagesBatch(captureId, streamingResults.value);
              }
              
              return finalResult;
              
            } catch (uploadError) {
              console.error(`[Process] Failed to upload image ${globalIndex}:`, uploadError);
              
              // Still return the captured image for UI, but mark upload as failed
              const failedResult = {
                timestamp,
                image: result.image,
                index: globalIndex,
                success: false,
                error: uploadError.message
              };
              
              uploadStats.value.failed++;
              const totalCompleted = uploadStats.value.success + uploadStats.value.failed;
              uploadProgress.value = Math.round((totalCompleted / totalImages) * 100);
              
              return failedResult;
            }
          } else {
            console.warn(`[Process] Failed to capture image ${globalIndex}/${totalImages} at ${timestamp}`);
            uploadStats.value.failed++;
            const totalCompleted = uploadStats.value.success + uploadStats.value.failed;
            uploadProgress.value = Math.round((totalCompleted / totalImages) * 100);
            return null;
          }
        } catch (error) {
          console.error(`[Process] Error capturing image ${globalIndex}/${totalImages}:`, error);
          uploadStats.value.failed++;
          const totalCompleted = uploadStats.value.success + uploadStats.value.failed;
          uploadProgress.value = Math.round((totalCompleted / totalImages) * 100);
          return null;
        }
      });
      
      const batchResults = await Promise.all(concurrentPromises);
      batchResults.filter(result => result !== null).forEach(result => {
        processedImages.value.push(result);
      });
      
      // Update progress
      const completedImages = batchStart + i + concurrentBatch.length;
      processProgress.value = Math.round((completedImages / totalImages) * 100);
      
      // Small delay between concurrent batches
      if (i + maxConcurrent < batchTimestamps.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // For large sequences, clear memory periodically by limiting displayed images
    if (isLargeSequence && processedImages.value.length > 50) {
      // Keep only the last 10 images in memory for UI display
      const recentImages = processedImages.value.slice(-10);
      // Store the full list temporarily for upload
      if (!window.fullImageSequence) {
        window.fullImageSequence = [];
      }
      window.fullImageSequence.push(...processedImages.value.slice(0, -10));
      processedImages.value = recentImages;
    }
    
    // Delay between batches for large sequences
    if (isLargeSequence && batchEnd < timestamps.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Restore full image sequence if it was split (for UI display only)
  if (window.fullImageSequence) {
    processedImages.value = [...window.fullImageSequence, ...processedImages.value];
    delete window.fullImageSequence;
  }
  
  // Final Firestore update with all successful uploads
  if (streamingResults.value.length > 0) {
    try {
      await updateCaptureWithImages(captureId, streamingResults.value);
      console.log(`[Process] Final Firestore update completed`);
    } catch (error) {
      console.error(`[Process] Error in final Firestore update:`, error);
    }
  }
  
  // Refresh the captures list to show updated data
  await fetchCaptures();
  
  const successCount = uploadStats.value.success;
  const failedCount = uploadStats.value.failed;
  
  console.log(`[Process] Streamlined process completed. Successfully captured and uploaded ${successCount}/${totalImages} images (${failedCount} failed)`);
  
  isProcessing.value = false;
  isUploading.value = false;
  
  // No need for upload section - everything is already uploaded!
  showUploadSection.value = false;
}

// Note: uploadImagesToStorage function removed - now integrated into startImageCapture

// Update capture document with image metadata (batch-friendly for large sequences)
async function updateCaptureWithImagesBatch(captureId, uploadResults) {
  try {
    const db = getFirestore(app);
    const captureRef = doc(db, "captures", captureId);
    
    const imageMetadata = uploadResults
      .filter(result => result.success)
      .map(result => ({
        index: result.index,
        timestamp: result.timestamp,
        downloadUrl: result.downloadUrl,
        storagePath: result.storagePath,
        size: result.size,
        uploadedAt: new Date().toISOString()
      }));
    
    // For large sequences, only update progress stats during streaming
    await updateDoc(captureRef, {
      imageCount: imageMetadata.length,
      processedAt: new Date().toISOString(),
      status: uploadResults.length === uploadStats.value.total ? 'completed' : 'processing'
    });
    
    console.log(`[Upload] Batch updated capture ${captureId} progress: ${imageMetadata.length} images`);
    
  } catch (error) {
    console.warn('[Upload] Error during batch update (continuing):', error);
  }
}

// Update capture document with image metadata (final update)
async function updateCaptureWithImages(captureId, uploadResults) {
  try {
    const db = getFirestore(app);
    const captureRef = doc(db, "captures", captureId);
    
    const imageMetadata = uploadResults
      .filter(result => result.success)
      .map(result => ({
        index: result.index,
        timestamp: result.timestamp,
        downloadUrl: result.downloadUrl,
        storagePath: result.storagePath,
        size: result.size,
        uploadedAt: new Date().toISOString()
      }));
    
    await updateDoc(captureRef, {
      images: imageMetadata,
      imageCount: imageMetadata.length,
      processedAt: new Date().toISOString(),
      status: 'completed'
    });
    
    console.log(`[Upload] Final update: capture ${captureId} with ${imageMetadata.length} image records`);
    
    // Refresh the captures list to show updated data
    await fetchCaptures();
    
  } catch (error) {
    console.error('[Upload] Error updating capture with image metadata:', error);
    throw error;
  }
}

function openProcessModal(capture) {
  // Check if capture already has stored images
  if (capture.images && capture.images.length > 0) {
    // Show re-process confirmation modal instead
    reprocessCapture.value = capture;
    showReprocessModal.value = true;
    return;
  }
  
  // No existing images, proceed with normal processing
  startProcessModal(capture);
}

function startProcessModal(capture) {
  processCapture.value = capture;
  
  // Calculate timestamps and image count
  const timestamps = calculateCaptureTimestamps(capture);
  processTimestamps.value = timestamps;
  processImageCount.value = timestamps.length;
  
  // Reset processing state
  isProcessing.value = false;
  processProgress.value = 0;
  processedImages.value = [];
  
  showProcessModal.value = true;
}

function closeProcessModal() {
  showProcessModal.value = false;
  processCapture.value = null;
  processImageCount.value = 0;
  processTimestamps.value = [];
  isProcessing.value = false;
  processProgress.value = 0;
  processedImages.value = [];
  
  // Reset upload state
  isUploading.value = false;
  uploadProgress.value = 0;
  uploadedImages.value = [];
  showUploadSection.value = false;
  
  // Reset streaming state
  streamingResults.value = [];
  uploadStats.value = { success: 0, failed: 0, total: 0 };
  
  // Clean up any temporary storage
  if (window.fullImageSequence) {
    delete window.fullImageSequence;
  }
}

// Close re-process confirmation modal
function closeReprocessModal() {
  showReprocessModal.value = false;
  reprocessCapture.value = null;
}

// Confirm re-processing (delete existing images and start new capture)
async function confirmReprocess() {
  if (!reprocessCapture.value) return;
  
  const capture = reprocessCapture.value;
  console.log(`[Process] Re-processing capture ${capture.id}, deleting ${capture.images?.length || 0} existing images`);
  
  try {
    // Delete existing images from Firebase Storage
    await storageService.deleteCapture(capture.id);
    console.log("[Process] Existing images deleted successfully");
    
    // Update Firestore to remove image metadata
    const db = getFirestore(app);
    const captureRef = doc(db, "captures", capture.id);
    await updateDoc(captureRef, {
      images: [],
      imageCount: 0,
      processedAt: null,
      status: null
    });
    console.log("[Process] Capture metadata cleared");
    
    // Refresh captures list to reflect changes
    await fetchCaptures();
    
    // Close re-process modal and start normal processing
    closeReprocessModal();
    startProcessModal(capture);
    
  } catch (error) {
    console.error("[Process] Error during re-process cleanup:", error);
    // Still proceed with processing even if cleanup fails
    closeReprocessModal();
    startProcessModal(capture);
  }
}

onMounted(() => {
  document.title = `${APP_NAME} - Capture`;
  
  // Initialize auth store from localStorage if needed
  const storedBaseUrl = localStorage.getItem('eenBaseUrl');
  const storedToken = localStorage.getItem('eenToken');
  const storedUserProfile = localStorage.getItem('eenUserProfile');

  if (storedBaseUrl && !eenAuthStore.baseUrl) {
    try {
      const url = new URL(storedBaseUrl);
      eenAuthStore.setBaseUrl({
        hostname: url.hostname,
        port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
      });
    } catch (err) {
      console.error('[Capture.vue] Failed to parse stored baseUrl:', err);
    }
  }
  if (storedToken && !eenAuthStore.token) {
    eenAuthStore.setToken(storedToken, 3600); // Default 1 hour expiration
  }
  if (storedUserProfile && !eenAuthStore.userProfile) {
    try {
      eenAuthStore.setUserProfile(JSON.parse(storedUserProfile));
    } catch (err) {
      console.error('[Capture.vue] Failed to parse stored userProfile:', err);
    }
  }
  
  console.log('[Capture.vue] Component mounted - EEN Auth State:', {
    isAuthenticated: eenAuthStore.isAuthenticated,
    hasToken: !!eenAuthStore.token,
    hasUserProfile: !!eenAuthStore.userProfile,
    userProfile: eenAuthStore.userProfile,
    baseUrl: eenAuthStore.baseUrl
  });
  
  if (eenAuthStore.isAuthenticated) {
    signInAndFetchData();
    
    // Set up token refresh interval
    tokenRefreshInterval = setInterval(async () => {
      const timeRemaining = eenAuthStore.getTokenTimeRemaining();
      if (timeRemaining && timeRemaining < 300000) { // 5 minutes
        console.log("[Capture.vue] Token refresh interval triggered");
        try {
          const { refreshToken } = await import('../services/auth');
          const success = await refreshToken();
          if (success) {
            // Refresh Firebase auth after EEN token refresh
            await firebaseAuthService.refreshAuth();
          }
        } catch (error) {
          console.error("[Capture.vue] Token refresh failed:", error);
        }
      }
    }, 60000); // Check every minute
  } else {
    error.value = "EEN user not authenticated.";
    loading.value = false;
  }
});

onUnmounted(async () => {
  // Clean up event listener on component unmount
  document.removeEventListener('keydown', handleEscapeKey);
  
  // Clear token refresh interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
  
  // Firebase Auth Service handles cleanup automatically through auth state listeners
  console.log("[Capture.vue] Component unmounted");
});

// Rehydrate auth store and re-check authentication on window focus
window.addEventListener('focus', async () => {
  // Try to rehydrate from localStorage/sessionStorage if needed
  const storedBaseUrl = localStorage.getItem('eenBaseUrl');
  const storedToken = localStorage.getItem('eenToken');
  const storedUserProfile = localStorage.getItem('eenUserProfile');

  if (storedBaseUrl && !eenAuthStore.baseUrl) {
    // Parse the baseUrl to extract hostname and port for the auth store
    try {
      const url = new URL(storedBaseUrl);
      eenAuthStore.setBaseUrl({
        hostname: url.hostname,
        port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
      });
    } catch (err) {
      console.error('[Capture.vue] Failed to parse stored baseUrl:', err);
    }
  }
  if (storedToken && !eenAuthStore.token) {
    eenAuthStore.setToken(storedToken, 3600); // Default 1 hour expiration
  }
  if (storedUserProfile && !eenAuthStore.userProfile) {
    try {
      eenAuthStore.setUserProfile(JSON.parse(storedUserProfile));
    } catch (err) {
      console.error('[Capture.vue] Failed to parse stored userProfile:', err);
    }
  }

  // If any critical value is missing, or not authenticated, re-sign in
  if (!eenAuthStore.isAuthenticated || !eenAuthStore.baseUrl || !eenAuthStore.token || !eenAuthStore.userProfile) {
    try {
      await signInAndFetchData();
    } catch (e) {
      console.error('[Capture.vue] Error re-authenticating on focus:', e);
    }
  }
});

// Persist auth state to localStorage when it changes
watch(() => eenAuthStore.baseUrl, (val) => {
  if (val) localStorage.setItem('eenBaseUrl', val);
  else localStorage.removeItem('eenBaseUrl');
});
watch(() => eenAuthStore.token, (val) => {
  if (val) localStorage.setItem('eenToken', val);
  else localStorage.removeItem('eenToken');
});
watch(() => eenAuthStore.userProfile, (val) => {
  if (val) localStorage.setItem('eenUserProfile', JSON.stringify(val));
  else localStorage.removeItem('eenUserProfile');
});
</script> 