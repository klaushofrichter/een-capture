import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const showRouteNotFoundModal = ref(false)
  const invalidPath = ref('')

  // Actions
  function showInvalidRouteNotification(path) {
    invalidPath.value = path
    showRouteNotFoundModal.value = true
  }

  function closeRouteNotFoundModal() {
    showRouteNotFoundModal.value = false
    invalidPath.value = ''
  }

  return {
    // State
    showRouteNotFoundModal,
    invalidPath,

    // Actions
    showInvalidRouteNotification,
    closeRouteNotFoundModal
  }
})
