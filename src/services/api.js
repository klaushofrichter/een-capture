import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const createAuthApi = () => {
  return axios.create({
    baseURL: 'https://auth.eagleeyenetworks.com',
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
