import { useAuthStore } from '../stores/auth'
import { createAuthApi } from './api'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
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
  console.log('getAuthUrl returns: ', url)
  return url
}

async function getToken(code) {
  const tokenParams = new URLSearchParams({
    code: code,
    redirect_uri: REDIRECT_URI
  })

  try {
    const api = createAuthApi()
    console.log('Token request params:', tokenParams)
    const response = await api.post('/oauth2/token?' + tokenParams) // this is calling the proxy with the code
    console.log('Token response:', response.data)
    return {
      token: response.data.accessToken,
      expiresIn: response.data.expiresIn,
      httpsBaseUrl: response.data.httpsBaseUrl,
      sessionId: response.data.sessionId
    }
  } catch (error) {
    console.log('Error after token request /oauth2/token:', error)
    if (error.response) {
      throw new Error(
        `Failed to get access token: ${error.response.status} ${error.response.statusText}`
      )
    }
    throw error
  }
}

export const handleAuthCallback = async code => {
  console.log('handleAuthCallback called with code: ', code);
  try {

    // we pass the code to the proxy to get the tokens
    const { token, expiresIn, httpsBaseUrl, sessionId } = await getToken(code);
    console.log('callback: token: ', token);
    console.log('callback: expiresIn: ', expiresIn);
    console.log('callback: httpsBaseUrl: ', httpsBaseUrl)
    console.log('callback: sessionId: ', sessionId)

    const authStore = useAuthStore()
    authStore.setToken(token, expiresIn)
    authStore.setBaseUrl(httpsBaseUrl)
    authStore.setRefreshToken('present') // this marks that the refresh token is present at the proxy
    authStore.setSessionId(sessionId)
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
    console.log('refreshToken in the store: ', refreshToken)
    if (!refreshToken) return false  // there is no refresh token in the store

    const api = createAuthApi()
    const response = await api.post('/refresh', null, { credentials: 'include' })  // we need to pass the session ID somehow

    console.log('refresh: response: ', response.data)

    authStore.setToken(response.data.access_token, response.data.expires_in)
    authStore.setRefreshToken('present after refresh')
  
    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
}
