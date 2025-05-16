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
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ capture.description || 'No description' }}</p>
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { APP_NAME } from '../constants'
import { getFirestore, collection, getDocs } from "firebase/firestore";

const authStore = useAuthStore()
const captures = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchCaptures = async () => {
  loading.value = true;
  error.value = null;
  try {
    const db = getFirestore();
    // Replace 'captures' with the actual name of your Firestore collection
    const querySnapshot = await getDocs(collection(db, "users"));
    captures.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching users: ", e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  document.title = `${APP_NAME} - Capture`;
  await fetchCaptures();
});
</script> 