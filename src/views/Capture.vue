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
          <div v-if="profileLoading" class="mt-4 text-sm text-blue-600 dark:text-blue-400">
            Loading your user profile...
          </div>
          <div v-if="userRegistered !== null && userEmail">
            <span v-if="userRegistered" class="text-green-600 dark:text-green-400">
              User {{ userEmail }} is registered
            </span>
            <span v-else class="text-red-600 dark:text-red-400">
              User {{ userEmail }} is not registered
            </span>
          </div>
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { userService } from '../services/user'
import { auth, db } from '../firebase'
import { APP_NAME } from '../constants'
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const authStore = useAuthStore()
const users = ref([]);
const loading = ref(true);
const error = ref(null);
const profileLoading = ref(false);
const userRegistered = ref(null); // null = unknown, true = registered, false = not registered
const userEmail = computed(() => authStore.userProfile?.email || '');

const ensureUserProfile = async () => {
  if (!authStore.userProfile) {
    profileLoading.value = true;
    try {
      const data = await userService.getUserProfile();
      authStore.setUserProfile({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });
    } catch (err) {
      error.value = err.message || 'Failed to load user profile';
    } finally {
      profileLoading.value = false;
    }
  }
};

const checkUserRegistration = async () => {
  userRegistered.value = null;
  if (!authStore.userProfile?.email) return;
  try {
    console.log("Checking user registration for:", authStore.userProfile.email);
    const q = query(collection(db, "documents"), where("email", "==", authStore.userProfile.email));
    const querySnapshot = await getDocs(q);
    userRegistered.value = !querySnapshot.empty;
  } catch (e) {
    error.value = e.message || 'Unknown error checking registration';
    userRegistered.value = null;
  }
};

const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const querySnapshot = await getDocs(collection(db, "documents"));
    users.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    error.value = e.message || 'Unknown error';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  document.title = `${APP_NAME} - User List`;
  const waitForAuth = setInterval(() => {
    if (auth) {
      clearInterval(waitForAuth);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await ensureUserProfile();
          await checkUserRegistration();
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