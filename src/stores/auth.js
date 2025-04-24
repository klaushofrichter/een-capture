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

  // Temporary storage for credentials during logout
  let tempCredentials = null
  let logoutInterval = null

  async function logout(onDelay) {
    // Store current credentials temporarily
    tempCredentials = {
      token: token.value,
      user: user.value,
      hostname: hostname.value,
      port: port.value,
      userProfile: userProfile.value
    }

    // Clear store values
    token.value = null
    user.value = null
    hostname.value = null
    port.value = null
    userProfile.value = null

    // Clear all localStorage items synchronously
    localStorage.clear()

    // Wait eight seconds to ensure cleanup is complete
    if (onDelay) {
      await new Promise(resolve => {
        const startTime = Date.now()
        logoutInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, 8000 - elapsed)
          onDelay(remaining)
          if (remaining === 0) {
            clearInterval(logoutInterval)
            logoutInterval = null
            resolve()
          }
        }, 50)
      })
    } else {
      await new Promise(resolve => setTimeout(resolve, 8000))
    }

    // Clear temporary credentials after successful logout
    tempCredentials = null

    // Force a full page reload to clear any cached state
    window.location.href = '/'
  }

  function cancelLogout() {
    if (tempCredentials) {
      // Clear the interval if it exists
      if (logoutInterval) {
        clearInterval(logoutInterval)
        logoutInterval = null
      }

      // Restore store values
      token.value = tempCredentials.token
      user.value = tempCredentials.user
      hostname.value = tempCredentials.hostname
      port.value = tempCredentials.port
      userProfile.value = tempCredentials.userProfile

      // Restore localStorage
      if (token.value) localStorage.setItem('auth_token', token.value)
      if (user.value) localStorage.setItem('user_data', JSON.stringify(user.value))
      if (hostname.value) localStorage.setItem('hostname', hostname.value)
      if (port.value) localStorage.setItem('port', String(port.value))

      // Clear temporary credentials
      tempCredentials = null
    }
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
    cancelLogout,
    initialize
  }
})
