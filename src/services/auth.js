import { useAuthStore } from '../stores/auth'
import { createAuthApi } from './api'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_EEN_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI
const AUTH_URL = 'https://auth.eagleeyenetworks.com/oauth2/authorize'

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'vms.all'
  })
  const url = `${AUTH_URL}?${params.toString()}`
  console.log('Authorization URL:', url)
  return url
}

async function getToken(code) {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    //client_id: CLIENT_ID,
    //client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  })

  try {
    const api = createAuthApi()
    console.log('Token request params:', tokenParams)
    const response = await api.post('/oauth2/token?' + tokenParams) // this is calling the proxy with the code
    console.log('Token response:', response.data)
    return {
      token: response.data.access_token,
      //refreshToken: response.data.refresh_token, // this is to be removed
      expiresIn: response.data.expires_in,
      httpsBaseUrl: response.data.httpsBaseUrl
    }
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Failed to get access token: ${error.response.status} ${error.response.statusText}`
      )
    }
    throw error
  }
}

export const handleAuthCallback = async code => {
  const authStore = useAuthStore()
  try {
    const { token, refreshToken, expiresIn, httpsBaseUrl } = await getToken(code)
    authStore.setToken(token, expiresIn)
    authStore.setRefreshToken(refreshToken)
    authStore.setBaseUrl(httpsBaseUrl)
    return { token, httpsBaseUrl }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

export const refreshToken = async () => {
  const authStore = useAuthStore()
  try {
    const refreshToken = authStore.refreshToken
    if (!refreshToken) return false

    const api = createAuthApi()
    const response = await api.post(
      '/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    )

    authStore.setToken(response.data.access_token, response.data.expires_in)
    authStore.setRefreshToken(response.data.refresh_token)
    if (response.data.httpsBaseUrl) {
      authStore.setBaseUrl(response.data.httpsBaseUrl)
    }

    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
}
