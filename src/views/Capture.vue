<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Capture List
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            A listing of the captures
          </p>
          <div v-if="profileLoading" class="mt-4 text-sm text-blue-600 dark:text-blue-400">
            Loading your user profile...
          </div>
          <div v-if="userRegistered !== null && userEmail" class="flex items-center justify-between mt-4">
            <div>
              <span v-if="userJustRegistered" class="text-green-600 dark:text-green-400">
                The user <span class="font-bold">{{ userEmail }}</span> is now registered
              </span>
              <span v-else-if="userRegistered" class="text-green-600 dark:text-green-400">
                The user <span class="font-bold">{{ userEmail }}</span> is registered
              </span>
              <span v-else class="text-red-600 dark:text-red-400">
                User <span class="font-bold">{{ userEmail }}</span> is not registered
              </span>
            </div>
            <button
              v-if="userRegistered"
              class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              @click="openUnregisterModal"
            >
              Unregister the user
            </button>
            <button
              v-else
              class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              @click="reloadPage"
            >
              Re-register
            </button>
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

      <!-- Modal -->
      <div v-if="showUnregisterModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-md w-full">
          <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Unregister</h2>
          <p class="mb-4 text-gray-700 dark:text-gray-300">
            Are you sure you want to unregister this user? <br>
            <span class="font-semibold">{{ userEmail }}</span><br>
            <span class="text-red-600 dark:text-red-400">All data for this user will be removed.</span>
          </p>
          <div class="flex justify-end space-x-2">
            <button
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              @click="closeUnregisterModal"
            >Cancel</button>
            <button
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              @click="confirmUnregister"
            >OK</button>
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
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const authStore = useAuthStore()
const users = ref([]);
const loading = ref(true);
const error = ref(null);
const profileLoading = ref(false);
const userRegistered = ref(null); // null = unknown, true = registered, false = not registered
const userJustRegistered = ref(false); // true if just registered in this session
const userEmail = computed(() => authStore.userProfile?.email || '');
const showUnregisterModal = ref(false);
const unregisterDocId = ref(null);

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
  userJustRegistered.value = false;
  unregisterDocId.value = null;
  if (!authStore.userProfile?.email) return;
  try {
    const q = query(collection(db, "documents"), where("email", "==", authStore.userProfile.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      userRegistered.value = true;
      userJustRegistered.value = false;
      unregisterDocId.value = querySnapshot.docs[0].id;
    } else {
      // Not registered, so register now
      const docRef = await addDoc(collection(db, "documents"), { email: authStore.userProfile.email });
      userRegistered.value = true;
      userJustRegistered.value = true;
      unregisterDocId.value = docRef.id;
    }
  } catch (e) {
    error.value = e.message || 'Unknown error checking/creating registration';
    userRegistered.value = null;
    userJustRegistered.value = false;
    unregisterDocId.value = null;
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

const openUnregisterModal = () => {
  showUnregisterModal.value = true;
};

const closeUnregisterModal = () => {
  showUnregisterModal.value = false;
};

const confirmUnregister = async () => {
  if (unregisterDocId.value) {
    try {
      await deleteDoc(doc(db, "documents", unregisterDocId.value));
      userRegistered.value = false;
      userJustRegistered.value = false;
      unregisterDocId.value = null;
      showUnregisterModal.value = false;
    } catch (e) {
      error.value = e.message || 'Unknown error unregistering user';
    }
  }
};

const reloadPage = () => {
  window.location.reload();
};

onMounted(() => {
  document.title = `${APP_NAME} - Capture List`;
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