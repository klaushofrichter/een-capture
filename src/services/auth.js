import { useAuthStore } from '../stores/auth'
// Remove createAuthApi import if no longer used elsewhere in this file
// import { createAuthApi } from './api'
import { API_CONFIG } from '../constants'

const CLIENT_ID = import.meta.env.VITE_EEN_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || API_CONFIG.REDIRECT_URL || 'http://127.0.0.1:3333'
const EEN_AUTH_URL = import.meta.env.VITE_EEN_AUTH_URL || 'https://auth.eagleeyenetworks.com/oauth2/authorize'

// Determine proxy URL, defaulting to local Vite server if VITE_AUTH_PROXY_URL is not set
const AUTH_PROXY_URL = import.meta.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333';

// Determine if we are using the local Vite proxy based on the URL structure
// Use local proxy if the URL (explicitly set or defaulted) points to localhost/127.0.0.1
const USE_LOCAL_VITE_PROXY = AUTH_PROXY_URL.includes('127.0.0.1') || AUTH_PROXY_URL.includes('localhost');

console.log(`[auth.js] Using ${USE_LOCAL_VITE_PROXY ? 'Local Vite Proxy' : 'Remote Proxy'} at ${AUTH_PROXY_URL}`);

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: API_CONFIG.SCOPES
  })
  const url = `${EEN_AUTH_URL}?${params.toString()}`
  return url
}

async function getAccessToken(code) {
  const tokenParams = new URLSearchParams({
    code: code,
    redirect_uri: REDIRECT_URI
  });

  // Construct path based on whether we target the local proxy or remote
  const relativePath = USE_LOCAL_VITE_PROXY ? '/proxy/getAccessToken' : '/getAccessToken';
  const requestUrl = `${AUTH_PROXY_URL}${relativePath}?${tokenParams.toString()}`;
  console.log(`[auth.js] Fetching: ${requestUrl}`);

  try {
    const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
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
    const { token, expiresIn, httpsBaseUrl, sessionId } = await getAccessToken(code);
    const authStore = useAuthStore();
    authStore.setToken(token, expiresIn);
    authStore.setBaseUrl(httpsBaseUrl);
    authStore.setRefreshToken('present');
    authStore.setSessionId(sessionId);
    return { token, httpsBaseUrl };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  const authStore = useAuthStore();
  const refreshTokenMarker = authStore.refreshToken;
  const sessionId = authStore.sessionId;

  if (!refreshTokenMarker || !sessionId) {
      console.log('[auth.js] Missing refresh token marker or session ID for refresh.');
      return false;
  }

  // Construct path based on proxy target
  const relativePath = USE_LOCAL_VITE_PROXY ? '/proxy/refreshAccessToken' : '/refreshAccessToken';
  const requestUrl = `${AUTH_PROXY_URL}${relativePath}?sessionId=${sessionId}`;
  console.log(`[auth.js] Fetching: ${requestUrl}`);

  try {
     const response = await fetch(requestUrl, {
        method: 'POST',
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
};
