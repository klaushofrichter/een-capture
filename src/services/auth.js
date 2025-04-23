import { useAuthStore } from '../stores/auth'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_EEN_CLIENT_SECRET
const REDIRECT_URI = 'http://127.0.0.1:3333'
const AUTH_URL = 'https://auth.eagleeyenetworks.com/oauth2/authorize'
const TOKEN_URL = 'https://auth.eagleeyenetworks.com/oauth2/token'
const API_URL = 'https://api.eagleeyenetworks.com/g/aaa/api/v3.0'

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'vms.all',
  })
  const url = `${AUTH_URL}?${params.toString()}`
  console.log('Authorization URL:', url)
  return url
}

export const handleAuthCallback = async (code) => {
  try {
    console.log('Starting token exchange with code:', code)
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    })
    
    console.log('Token request params:', tokenParams.toString())

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    })

    console.log('Token response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Token response data:', {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    })

    const authStore = useAuthStore()
    authStore.setToken(data.access_token)
    
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