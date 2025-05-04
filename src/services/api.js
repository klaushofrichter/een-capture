import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const createAuthApi = () => {
  // set Access-Control-Allow-Origin to the origin of the request
  return axios.create({
    baseURL: import.meta.env.VITE_AUTH_PROXY_URL || 'http://127.0.0.1:3333', // default to local VITE proxy
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
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
