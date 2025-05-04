import { useAuthStore } from '../stores/auth'
import { createAuthApi } from './api'
import { API_CONFIG } from '../constants'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || API_CONFIG.REDIRECT_URL
const AUTH_URL = import.meta.env.VITE_EEN_AUTH_URL || 'https://auth.eagleeyenetworks.com/oauth2/authorize'

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: API_CONFIG.SCOPES
  })
  const url = `${AUTH_URL}?${params.toString()}`
  return url
}

async function getAccessToken(code) {
  const tokenParams = new URLSearchParams({
    code: code,
    redirect_uri: REDIRECT_URI
  });

  // Use fetch directly, targeting the /proxy path
  const requestUrl = `/proxy/getAccessToken?${tokenParams.toString()}`;
  console.log(`[auth.js] Fetching: ${requestUrl}`);

  try {
    const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
             // Content-Type might not be strictly needed for fetch if body is empty
             // but keeping it doesn't hurt
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        // Body is empty, params are in URL
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${errorText || response.statusText}`);
    }

    const data = await response.json();

    return {
      token: data.accessToken,
      expiresIn: data.expiresIn,
      httpsBaseUrl: data.httpsBaseUrl,
      sessionId: data.sessionId
    }
  } catch (error) {
    console.error('[auth.js] getAccessToken fetch error:', error);
    // Rethrow a more specific error if needed, or the original
    throw new Error(`Failed to get access token: ${error.message || error}`);
  }
}

export const handleAuthCallback = async code => {
  try {
    // we pass the code to the proxy to get the tokens
    const { token, expiresIn, httpsBaseUrl, sessionId } = await getAccessToken(code)

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
  const refreshToken = authStore.refreshToken
  const sessionId = authStore.sessionId

  if (!refreshToken || !sessionId) {
      console.log('[auth.js] Missing refresh token marker or session ID for refresh.');
      return false;
  }

  // Use fetch directly, targeting the /proxy path
  const requestUrl = `/proxy/refreshAccessToken?sessionId=${sessionId}`;
  console.log(`[auth.js] Fetching: ${requestUrl}`);

  try {
     const response = await fetch(requestUrl, {
        method: 'POST',
        // Include credentials (cookies) for the refresh request
        credentials: 'include',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
     });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorText || response.statusText}`);
    }

    const data = await response.json();

    if (!data.accessToken || !data.expiresIn) {
      console.error('[auth.js] Invalid response data from refresh call:', data);
      return false;
    }

    authStore.setToken(data.accessToken, data.expiresIn);
    authStore.setRefreshToken('present after refresh');
    return true;

  } catch (error) {
    console.error('[auth.js] refreshToken fetch error:', error);
    return false;
  }
}
