import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const createAuthApi = () => {
  let config = {
    // For dev, proxy path is /proxy. For prod, it's the full worker URL.
    baseURL: '/proxy', // Default for dev
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  // In production, override baseURL with the specific Cloudflare Worker URL
  if (import.meta.env.PROD) {
    if (!import.meta.env.VITE_AUTH_PROXY_URL_PROD) {
      console.error(
        'ERROR: VITE_AUTH_PROXY_URL_PROD is not set for production build! Auth API calls will likely fail.'
      );
      // Fallback or specific error handling might be needed here
      // For now, it will try to use /proxy which won't work in prod without the worker URL
    } else {
      config.baseURL = import.meta.env.VITE_AUTH_PROXY_URL_PROD;
    }
  }

  return axios.create(config);
}

export const createApiInstance = () => {
  const authStore = useAuthStore()

  if (!authStore.baseUrl) {
    throw new Error('Base URL is not available')
  }

  const instance = axios.create({
    baseURL: authStore.baseUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authStore.token}`
    }
  })

  return instance
}
