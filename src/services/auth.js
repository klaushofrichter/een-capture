import { useAuthStore } from '../stores/auth'
import { createAuthApi } from './api'
import { API_CONFIG } from '../constants'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || API_CONFIG.REDIRECT_URL
const AUTH_URL = 'https://auth.eagleeyenetworks.com/oauth2/authorize'

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: API_CONFIG.SCOPES
  })
  const url = `${AUTH_URL}?${params.toString()}`
  //console.log('getAuthUrl returns: ', url)
  return url
}

async function getAccessToken(code) {
  // build the query string for the proxy
  const tokenParams = new URLSearchParams({
    code: code,
    redirect_uri: REDIRECT_URI
  })

  try {
    const api = createAuthApi() // for communication with the proxy

    const response = await api.post('/getAccessToken?' + tokenParams) // this is calling the proxy with the code
    //console.log('response from the getAccessToken call: ', response)

    return {
      token: response.data.accessToken,
      expiresIn: response.data.expiresIn,
      httpsBaseUrl: response.data.httpsBaseUrl,
      sessionId: response.data.sessionId
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
  //console.log('handleAuthCallback called with code: ', code)
  try {
    // we pass the code to the proxy to get the tokens
    const { token, expiresIn, httpsBaseUrl, sessionId } = await getAccessToken(code)

    const authStore = useAuthStore()
    authStore.setToken(token, expiresIn)
    authStore.setBaseUrl(httpsBaseUrl)
    authStore.setRefreshToken('present') // this marks that the refresh token is present at the proxy
    authStore.setSessionId(sessionId)
    //console.log('handleAuthCallback: token: ', token)
    //console.log('handleAuthCallback: httpsBaseUrl: ', httpsBaseUrl)
    //console.log('handleAuthCallback: sessionId: ', sessionId)
    return { token, httpsBaseUrl }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

export const refreshToken = async () => {
  const authStore = useAuthStore()
  try {
    // we do not have a refresh token, just an indication that the refresh token is present at the proxy
    const refreshToken = authStore.refreshToken
    //console.log('refreshToken for the refresh call coming from API: ', refreshToken)

    if (!refreshToken) return false // there is no refresh token at the proxy

    // get the session ID from the store - this should not be needed because the session ID is in the cookie
    const sessionId = authStore.sessionId
   // console.log('sessionId for the refresh call coming from API: ', sessionId)

    const api = createAuthApi() // for communication with the proxy
    const response = await api.post('/refreshAccessToken?sessionId=' + sessionId, null, {
      credentials: 'include'
    })

    //console.log('response.data from the refresh call: ', response.data)

    // check if the response is valid
    if (!response.data.accessToken || !response.data.expiresIn) {
      console.error('Invalid response from the refresh call')
      return false
    }

    authStore.setToken(response.data.accessToken, response.data.expiresIn) // save the new token and expiresIn
    authStore.setRefreshToken('present after refresh') // this marks that the refresh token is present at the proxy

    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
}
