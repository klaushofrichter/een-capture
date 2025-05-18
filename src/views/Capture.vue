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
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";

const FIREBASE_ADMIN_EMAIL = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL;
const FIREBASE_ADMIN_PASSWORD = import.meta.env.VITE_FIREBASE_ADMIN_PASSWORD;

const eenAuthStore = useAuthStore()
const captures = ref([]);
const loading = ref(true);
const error = ref(null);
let firebaseAdminUser = null; // To keep track of the signed-in Firebase admin user

const fetchCaptures = async () => {
  loading.value = true;
  error.value = null;
  console.log("Attempting to fetch captures as Firebase admin...")

  // Get the EEN authenticated user's identifier (e.g., email)
  // Adjust property access based on how EEN user info is stored in your Pinia store
  //const eenUserIdentifier = eenAuthStore?.userProfile.email
  const eenUserIdentifier = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL   // use the admin email to access user user list
  console.log("eenUserIdentifier", eenUserIdentifier)
  // OR: const eenUserIdentifier = eenAuthStore.user?.email;

  if (!eenUserIdentifier) {
    console.error("EEN user identifier (e.g., email) not found in Pinia store.");
    error.value = "EEN user details not available to query captures.";
    loading.value = false;
    return;
  }
  console.log(`Fetching captures for EEN user: ${eenUserIdentifier}`);

  try {
    const db = getFirestore();
    // IMPORTANT: Replace 'eenUserEmailField' with the actual field name in your 'captures' documents
    // that stores the EEN user's email or other unique identifier used for filtering.
    const q = query(collection(db, "captures"), where("eenUserEmailField", "==", eenUserIdentifier));
    const querySnapshot = await getDocs(q);
    captures.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Captures fetched successfully:", captures.value);
    if (captures.value.length === 0) {
      console.log("No captures found for this EEN user.");
    }
  } catch (e) {
    console.error("Error fetching captures: ", e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const signInAdminAndFetchData = async () => {
  const auth = getAuth();
  console.log("auth", auth);
  try {
    console.log(`Attempting Firebase sign-in as admin: ${FIREBASE_ADMIN_EMAIL}, ${FIREBASE_ADMIN_PASSWORD}`);
    const userCredential = await signInWithEmailAndPassword(auth, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD);
    firebaseAdminUser = userCredential.user;
    console.log("Firebase admin signed in successfully:", firebaseAdminUser.uid);
    await fetchCaptures(); // Now fetch data
  } catch (signInError) {
    console.error("Firebase admin sign-in error:", signInError);
    error.value = `Firebase admin sign-in failed: ${signInError.message}`;
    loading.value = false;
  }
};

onMounted(() => {
  document.title = `${APP_NAME} - Capture`;
  // Ensure EEN authentication has set the necessary user info in the store first.
  // This assumes your EEN login flow populates `eenAuthStore` synchronously before navigating here,
  // or you have another mechanism to await EEN auth completion.
  if (eenAuthStore.isAuthenticated) { // Check if EEN auth is considered complete
    console.log("EEN user authenticated according to Pinia store. Fetching captures.");
    signInAdminAndFetchData();
  } else {
    console.warn("EEN user not authenticated according to Pinia store. Cannot fetch captures.");
    error.value = "EEN user not authenticated. Please log in via EEN first.";
    loading.value = false;
  }
});

onUnmounted(async () => {
  // Optionally, sign out the Firebase admin user when the component is unmounted
  // to prevent the session from persisting longer than needed for this dev approach.
  if (firebaseAdminUser) {
    const auth = getAuth();
    try {
      await firebaseSignOut(auth);
      console.log("Firebase admin signed out on component unmount.");
      firebaseAdminUser = null;
    } catch (e) {
      console.error("Error signing out Firebase admin on unmount:", e);
    }
  }
});
</script> 