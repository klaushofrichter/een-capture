import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const createAxiosInstance = () => {
  const authStore = useAuthStore()

  if (!authStore.baseUrl) {
    throw new Error('Base URL is not available')
  }
  console.log("createAxiosInstance", authStore.token);
  return axios.create({
    baseURL: authStore.baseUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authStore.token}`
    }
  })
}

export const userService = {
  async getUserProfile() {
    try {
      const api = createAxiosInstance()
      const response = await api.get('/api/v3.0/users/self')
      return response.data
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch profile data')
      }
      throw error
    }
  }
}
