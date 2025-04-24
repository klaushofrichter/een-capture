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

async function getToken(code) {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return {
    token: data.access_token,
    httpsBaseUrl: data.httpsBaseUrl
  }
}

export const handleAuthCallback = async (code) => {
  const authStore = useAuthStore()
  try {
    const { token, httpsBaseUrl } = await getToken(code)
    authStore.setToken(token)
    authStore.setBaseUrl(httpsBaseUrl)
    return { token, httpsBaseUrl }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return false

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const authStore = useAuthStore()
    authStore.setToken(data.access_token)
    if (data.httpsBaseUrl) {
      authStore.setBaseUrl(data.httpsBaseUrl)
    }

    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
} 