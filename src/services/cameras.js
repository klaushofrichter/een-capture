import { useAuthStore } from '../stores/auth'
import securityService from './security'

/**
 * Camera Service for interacting with EEN Camera APIs
 */
class CameraService {
  /**
   * Get camera details by ID
   * @param {string} cameraId - The ID of the camera to fetch
   * @returns {Promise<Object>} Camera details
   * @throws {Error} If the request fails or camera is not found
   */
  async getCameraById(cameraId) {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    if (!authStore.baseUrl) {
      throw new Error('EEN base URL not configured')
    }

    if (!cameraId) {
      throw new Error('Camera ID is required')
    }

    try {
      const requestUrl = `${authStore.baseUrl}/api/v3.0/cameras/${cameraId}`
      
      // Validate URL scheme
      if (!securityService.validateUrlScheme(requestUrl)) {
        throw new Error('Invalid request URL scheme')
      }
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Camera not found: ${cameraId}`)
        }
        throw new Error(`Failed to fetch camera: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[CameraService] Error fetching camera:', error)
      throw error
    }
  }
}

// Create and export a singleton instance
export const cameraService = new CameraService()

// Export the class for testing or multiple instances if needed
export { CameraService } 