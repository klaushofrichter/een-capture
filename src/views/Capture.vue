<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Capture
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <span>Capture and manage your content</span>
            <span v-if="eenAuthStore.userProfile?.email">
              <span class="text-gray-500 dark:text-gray-400">User: </span>
              <span class="text-blue-600 dark:text-blue-400 font-medium">{{ eenAuthStore.userProfile.email }}</span>
            </span>
          </p>
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
                    @click="openCreateModal" 
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    :disabled="loading"
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
                    class="p-2 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    <div @click="openCaptureModal(capture)" class="cursor-pointer">
                      <!-- Adjust this based on your data structure -->
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ capture.name || 'Unnamed Capture' }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ capture.eenUserEmailField || 'No email' }}</p>
                      <p v-if="capture.createdAt" class="text-xs text-gray-500 dark:text-gray-400">
                        Created: {{ new Date(capture.createdAt).toLocaleString() }}
                      </p>
                    </div>
                    <!-- Delete button -->
                    <div class="mt-2 flex justify-end">
                      <button 
                        @click.stop="openDeleteModal(capture)"
                        class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                </ul>
                <p v-if="!loading && !error && captures.length === 0" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  No captures found.
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
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create New Capture
        </h3>
        <button 
          @click="closeCreateModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="pt-4">
        <form @submit.prevent="createCapture" class="space-y-4">
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

          <!-- User Email (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Email
            </label>
            <p class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100">
              {{ eenAuthStore.userProfile?.email || 'No email available' }}
            </p>
          </div>

          <!-- Create Date (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Create Date
            </label>
            <p class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100">
              {{ new Date().toLocaleString() }}
            </p>
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button 
              type="button"
              @click="closeCreateModal"
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              :disabled="!createForm.name.trim()"
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
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Capture Details
        </h3>
        <button 
          @click="closeCaptureModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div v-if="selectedCapture" class="pt-4">
        <div class="space-y-4">
          <!-- Capture Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {{ selectedCapture.name || 'Unnamed Capture' }}
            </p>
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

          <!-- Capture ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capture ID
            </label>
            <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
              {{ selectedCapture.id }}
            </p>
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
            @click="openDeleteModal(selectedCapture); closeCaptureModal()"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Delete Capture
          </button>
          <button 
            @click="closeCaptureModal"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
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
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Capture
        </h3>
        <button 
          @click="closeDeleteModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
            @click="closeDeleteModal"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="deleteCapture"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { APP_NAME } from '../constants'
import { getFirestore, collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { firebaseAuthService } from '../services/firebase-auth'
import { app } from '../firebase'

const eenAuthStore = useAuthStore()
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
  description: ''
});

// Delete modal state
const showDeleteModal = ref(false);
const captureToDelete = ref(null);

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
    
    // First, let's try to get ALL documents in the captures collection for debugging
    console.log("[Capture.vue] Fetching ALL captures for debugging...");
    const allCapturesQuery = query(collection(db, "captures"));
    const allCapturesSnapshot = await getDocs(allCapturesQuery);
    
    console.log("[Capture.vue] Total documents in captures collection:", allCapturesSnapshot.size);
    allCapturesSnapshot.forEach((doc) => {
      console.log("[Capture.vue] Document found:", {
        id: doc.id,
        data: doc.data(),
        eenUserEmailField: doc.data().eenUserEmailField
      });
    });
    
    // Now try the specific query
    console.log("[Capture.vue] Trying specific query with eenUserEmailField ==", eenUserIdentifier);
    const q = query(collection(db, "captures"), where("eenUserEmailField", "==", eenUserIdentifier));
    const querySnapshot = await getDocs(q);
    
    console.log("[Capture.vue] Specific query returned:", querySnapshot.size, "documents");
    captures.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log("Captures fetched successfully:", captures.value);
    if (captures.value.length === 0) {
      console.log("No captures found for this EEN user.");
      // For debugging, let's also try to show all captures
      const allCaptures = allCapturesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("All captures in collection (for debugging):", allCaptures);
      
      // Temporarily show all captures in UI for debugging
      captures.value = allCaptures;
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
  
  if (!firebaseAuthService.isAuthenticated()) {
    console.error("[Capture.vue] User must be authenticated to create capture");
    return;
  }

  const eenUserEmail = eenAuthStore?.userProfile?.email;
  if (!eenUserEmail) {
    console.error("[Capture.vue] EEN user email not available");
    return;
  }

  // Validate form
  if (!createForm.value.name.trim()) {
    console.error("[Capture.vue] Capture name is required");
    return;
  }

  try {
    const db = getFirestore(app);
    const newCapture = {
      name: createForm.value.name.trim(),
      description: createForm.value.description.trim(),
      eenUserEmailField: eenUserEmail,
      createdAt: new Date().toISOString()
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
    description: ''
  };
  showCreateModal.value = true;
};

// Close create modal
const closeCreateModal = () => {
  console.log("[Capture.vue] Closing create capture modal");
  showCreateModal.value = false;
  createForm.value = {
    name: '',
    description: ''
  };
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
    const db = getFirestore(app);
    await deleteDoc(doc(db, "captures", captureToDelete.value.id));
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
    // Close whichever modal is currently open
    if (showDeleteModal.value) {
      closeDeleteModal();
    } else if (showCreateModal.value) {
      closeCreateModal();
    } else if (showModal.value) {
      closeCaptureModal();
    }
  }
};

// Watch for modal state changes to add/remove ESC key listener
watch([showModal, showCreateModal, showDeleteModal], ([modal, createModal, deleteModal]) => {
  const anyModalOpen = modal || createModal || deleteModal;
  
  if (anyModalOpen) {
    // Add ESC key listener when any modal opens
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    // Remove ESC key listener when all modals are closed
    document.removeEventListener('keydown', handleEscapeKey);
  }
}, { immediate: true });

onMounted(() => {
  document.title = `${APP_NAME} - Capture`;
  console.log('[Capture.vue] Component mounted - EEN Auth State:', {
    isAuthenticated: eenAuthStore.isAuthenticated,
    hasToken: !!eenAuthStore.token,
    hasUserProfile: !!eenAuthStore.userProfile,
    userProfile: eenAuthStore.userProfile
  });
  
  if (eenAuthStore.isAuthenticated) {
    signInAndFetchData();
  } else {
    error.value = "EEN user not authenticated.";
    loading.value = false;
  }
});

onUnmounted(async () => {
  // Clean up event listener on component unmount
  document.removeEventListener('keydown', handleEscapeKey);
  // Firebase Auth Service handles cleanup automatically through auth state listeners
  // No manual cleanup needed as we're using the global Firebase app instance
  console.log("[Capture.vue] Component unmounted");
});
</script> 