import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  function setUser(userData) {
    user.value = userData
    localStorage.setItem('user_data', JSON.stringify(userData))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  function initialize() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_data')
    if (storedToken) token.value = storedToken
    if (storedUser) user.value = JSON.parse(storedUser)
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout,
    initialize
  }
}) 