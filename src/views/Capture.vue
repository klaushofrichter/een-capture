<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Capture
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Capture and manage your content
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
                <!-- Display fetched data -->
                <div v-if="loading" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Loading captures...
                </div>
                <div v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">
                  Error loading captures: {{ error }}
                </div>
                <ul v-if="!loading && !error && captures.length > 0" class="mt-4 space-y-2">
                  <li v-for="capture in captures" :key="capture.id" class="p-2 bg-gray-100 dark:bg-gray-600 rounded">
                    <!-- Adjust this based on your data structure -->
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ capture.name || 'Unnamed Capture' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ capture.email || 'No email' }}</p>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { APP_NAME } from '../constants'
import { getFirestore, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { firebaseAuthService } from '../services/firebase-auth'
import { app } from '../firebase'

const eenAuthStore = useAuthStore()
const captures = ref([]);
const loading = ref(true);
const error = ref(null);

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
  // Firebase Auth Service handles cleanup automatically through auth state listeners
  // No manual cleanup needed as we're using the global Firebase app instance
  console.log("[Capture.vue] Component unmounted");
});
</script> 