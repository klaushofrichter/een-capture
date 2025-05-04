import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const createAuthApi = () => {
  // Base URL points to the proxy (local Vite via /proxy, or deployed worker)
  const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL

  if (!proxyUrl) {
    console.error(
      'ERROR: VITE_AUTH_PROXY_URL environment variable is not set! Set it to the proxy URL (e.g., http://127.0.0.1:3333 or your Cloudflare worker URL).'
    )
  }

  let config = {
    // Use the proxy URL directly. It will contain either the local path or the full worker URL.
    baseURL: proxyUrl || '',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  return axios.create(config)
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
