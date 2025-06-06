import { useAuthStore } from '../stores/auth'
import securityService from './security'

/**
 * Media Service for interacting with EEN Media APIs
 */
class MediaService {
  /**
   * Convert ArrayBuffer to base64 string
   * @param {ArrayBuffer} buffer - The array buffer to convert
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  /**
   * Get a live image from a camera
   * @param {string} deviceId - The ID of the device (camera)
   * @param {string} [previewType='jpeg'] - The type of preview to fetch
   * @returns {Promise<{ image: string|null, timestamp: string|null, prevToken: string|null }>} Live image data and headers
   */
  async getLiveImage(deviceId, previewType = 'jpeg') {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    if (!authStore.baseUrl) {
      throw new Error('EEN base URL not configured')
    }
    if (!deviceId) {
      throw new Error('Device ID is required')
    }

    try {
      const url = `${authStore.baseUrl}/api/v3.0/media/liveImage.${previewType}?deviceId=${encodeURIComponent(deviceId)}&type=preview`
      
      // Validate URL scheme
      if (!securityService.validateUrlScheme(url)) {
        throw new Error('Invalid request URL scheme')
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/jpeg',
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const timestamp = response.headers.get('X-Een-Timestamp')
      const prevToken = response.headers.get('X-Een-PrevToken')

      if (!response.ok) {
        return { image: null, timestamp, prevToken }
      }

      // Get image as base64
      const arrayBuffer = await response.arrayBuffer()
      const base64Image = `data:image/jpeg;base64,${this.arrayBufferToBase64(arrayBuffer)}`
      return { image: base64Image, timestamp, prevToken }
    } catch (error) {
      console.error('[MediaService] Error fetching live image:', error)
      return { image: null, timestamp: null, prevToken: null }
    }
  }

  /**
   * Get a recorded image from a camera at a specific timestamp
   * @param {string} deviceId - The ID of the device (camera)
   * @param {string} timestamp - ISO 8601 timestamp for the image
   * @param {string} [type='preview'] - The type of image to fetch ('preview' or 'main')
   * @returns {Promise<{ image: string|null, timestamp: string|null, prevToken: string|null }>} Recorded image data and headers
   */
  async getRecordedImage(deviceId, timestamp, type = 'preview') {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    if (!authStore.baseUrl) {
      throw new Error('EEN base URL not configured')
    }
    if (!deviceId) {
      throw new Error('Device ID is required')
    }
    if (!timestamp) {
      throw new Error('Timestamp is required')
    }

    try {
      const url = `${authStore.baseUrl}/api/v3.0/media/recordedImage.jpeg?deviceId=${encodeURIComponent(deviceId)}&timestamp__gte=${encodeURIComponent(timestamp)}&type=${encodeURIComponent(type)}`
      
      // Validate URL scheme
      if (!securityService.validateUrlScheme(url)) {
        throw new Error('Invalid request URL scheme')
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/jpeg',
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const eenTimestamp = response.headers.get('X-Een-Timestamp')
      const prevToken = response.headers.get('X-Een-PrevToken')

      if (!response.ok) {
        return { image: null, timestamp: eenTimestamp, prevToken }
      }

      // Get image as base64
      const arrayBuffer = await response.arrayBuffer()
      const base64Image = `data:image/jpeg;base64,${this.arrayBufferToBase64(arrayBuffer)}`
      return { image: base64Image, timestamp: eenTimestamp, prevToken }
    } catch (error) {
      console.error('[MediaService] Error fetching recorded image:', error)
      return { image: null, timestamp: null, prevToken: null }
    }
  }
}

// Create and export a singleton instance
export const mediaService = new MediaService()

// Export the class for testing or multiple instances if needed
export { MediaService } 