<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            User List
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            List of all users in the database.
          </p>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700">
          <div class="px-4 py-5 sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Users</h4>
                <!-- Display fetched data -->
                <div v-if="loading" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Loading users...
                </div>
                <div v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">
                  Error loading users: {{ error }}
                </div>
                <ul v-if="!loading && !error && users.length > 0" class="mt-4 space-y-2">
                  <li v-for="user in users" :key="user.id" class="p-2 bg-gray-100 dark:bg-gray-600 rounded">
                    <!-- Display user properties - adjust based on your user document structure -->
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ user.title || 'No Email' }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">ID: {{ user.id }}</p>
                  </li>
                </ul>
                <p v-if="!loading && !error && users.length === 0" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  No users found.
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
// Import the auth and db instances from firebase.js
import { auth, db } from '../firebase'
import { APP_NAME } from '../constants'
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const users = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  console.log("Attempting to fetch users...");

  try {
    console.log("Fetching users from collection: documents");
    const querySnapshot = await getDocs(collection(db, "documents"));
    console.log("Query completed", querySnapshot);
    users.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Users fetched successfully:", users.value);
    if (users.value.length === 0) {
      console.log("No users found in the collection.");
    }
  } catch (e) {
    console.error("Error fetching users: ", e);
    error.value = e.message || 'Unknown error';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  document.title = `${APP_NAME} - User List`;
  console.log("onMounted called - auth:", auth);

  const waitForAuth = setInterval(() => {
    if (auth) {
      clearInterval(waitForAuth);
      onAuthStateChanged(auth, (user) => {
        console.log("onAuthStateChanged fired. User:", user);
        if (user) {
          fetchUsers();
        } else {
          error.value = "You must be authenticated to view users.";
          loading.value = false;
        }
      });
    }
  }, 100);
});
</script> 