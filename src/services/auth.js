import api from './api'
import { useAuthStore } from '../stores/auth'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_EEN_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email'
  })

  return `https://login.eagleeyenetworks.com/oauth2/authorize?${params.toString()}`
}

export const handleAuthCallback = async (code) => {
  try {
    const response = await api.post('/oauth2/token', {
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    })

    const { access_token, id_token } = response.data
    const authStore = useAuthStore()
    authStore.setToken(access_token)

    // Get user info using the access token
    const userResponse = await api.get('/oauth2/userinfo')
    authStore.setUser(userResponse.data)

    return true
  } catch (error) {
    console.error('Authentication error:', error)
    return false
  }
}

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return false

    const response = await api.post('/oauth2/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })

    const { access_token } = response.data
    const authStore = useAuthStore()
    authStore.setToken(access_token)

    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
} 