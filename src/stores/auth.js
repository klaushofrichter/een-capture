import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const hostname = ref(null)
  const port = ref(null)
  const userProfile = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const baseUrl = computed(() => {
    if (!hostname.value) return null
    return `https://${hostname.value}${port.value ? `:${port.value}` : ''}`
  })

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  function setBaseUrl(urlData) {
    if (urlData && typeof urlData === 'object') {
      hostname.value = urlData.hostname
      port.value = urlData.port
      localStorage.setItem('hostname', urlData.hostname)
      if (urlData.port) {
        localStorage.setItem('port', String(urlData.port))
      } else {
        localStorage.removeItem('port')
      }
    } else {
      hostname.value = null
      port.value = null
      localStorage.removeItem('hostname')
      localStorage.removeItem('port')
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

  function setUserProfile(profile) {
    userProfile.value = profile
  }

  function logout() {
    token.value = null
    user.value = null
    hostname.value = null
    port.value = null
    userProfile.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('hostname')
    localStorage.removeItem('port')
  }

  function initialize() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_data')
    const storedHostname = localStorage.getItem('hostname')
    const storedPort = localStorage.getItem('port')

    if (storedToken) {
      token.value = storedToken
    }
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
    if (storedHostname) {
      hostname.value = storedHostname
      if (storedPort) {
        port.value = Number(storedPort)
      }
    }
  }

  // Initialize the store
  initialize()

  return {
    token,
    user,
    hostname,
    port,
    userProfile,
    isAuthenticated,
    baseUrl,
    setToken,
    setUser,
    setBaseUrl,
    setUserProfile,
    logout,
    initialize
  }
})
