import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const httpsBaseUrl = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  function setHttpsBaseUrl(baseUrl) {
    httpsBaseUrl.value = baseUrl
    if (baseUrl) {
      localStorage.setItem('https_base_url', JSON.stringify(baseUrl))
    } else {
      localStorage.removeItem('https_base_url')
    }
  }

  function setUser(userData) {
    user.value = userData
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user_data')
    }
  }

  function logout() {
    token.value = null
    user.value = null
    httpsBaseUrl.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('https_base_url')
  }

  function initialize() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_data')
    const storedBaseUrl = localStorage.getItem('https_base_url')
    
    if (storedToken) {
      token.value = storedToken
    }
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
    if (storedBaseUrl) {
      httpsBaseUrl.value = JSON.parse(storedBaseUrl)
    }
  }

  initialize()

  return {
    token,
    user,
    httpsBaseUrl,
    isAuthenticated,
    setToken,
    setUser,
    setHttpsBaseUrl,
    logout
  }
}) 