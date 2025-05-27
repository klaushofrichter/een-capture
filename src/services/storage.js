import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage'
import securityService from './security'

/**
 * Storage Service for managing image uploads to Firebase Cloud Storage
 * Optimized for large image sequences (1000+ images)
 */
class StorageService {
  constructor() {
    // Configuration for large uploads
    this.maxConcurrentUploads = 5 // Parallel uploads
    this.batchSize = 10 // Firestore batch update size
    this.retryAttempts = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Convert base64 data URL to Blob
   * @param {string} dataUrl - Base64 data URL (e.g., "data:image/jpeg;base64,...")
   * @returns {Blob} Blob object
   */
  dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  /**
   * Upload a single image to Firebase Storage with retry logic
   * @param {string} captureId - The capture ID
   * @param {number} imageIndex - The image index in the sequence
   * @param {string} base64Image - Base64 image data URL
   * @param {string} timestamp - ISO timestamp for the image
   * @param {number} attempt - Current retry attempt
   * @returns {Promise<{downloadUrl: string, storagePath: string}>} Upload result
   */
  async uploadImage(captureId, imageIndex, base64Image, timestamp, attempt = 1) {
    try {
      // Security validation
      securityService.validateFirebaseOperation('upload')
      securityService.checkRateLimit('upload', 1000, 60000) // Max 1000 uploads per minute
      
      // Validate the base64 image data
      if (!base64Image || !base64Image.startsWith('data:image/')) {
        throw new Error('Invalid image data format')
      }
      // Create a blob from the base64 image
      const blob = this.dataUrlToBlob(base64Image)
      
      // Create storage path: captures/{captureId}/image_{index:03d}.jpg
      const fileName = `image_${String(imageIndex).padStart(3, '0')}.jpg`
      const storagePath = `captures/${captureId}/${fileName}`
      const storageRef = ref(storage, storagePath)
      
      // Add metadata
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          captureId: captureId,
          imageIndex: String(imageIndex),
          timestamp: timestamp,
          uploadedAt: new Date().toISOString()
        }
      }
      
      // Upload the blob
      const snapshot = await uploadBytes(storageRef, blob, metadata)
      
      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref)
      
      return {
        downloadUrl,
        storagePath,
        size: snapshot.metadata.size,
        fullPath: snapshot.metadata.fullPath
      }
    } catch (error) {
      console.error(`[StorageService] Error uploading image ${imageIndex} (attempt ${attempt}):`, error)
      
      // Retry logic
      if (attempt < this.retryAttempts) {
        console.log(`[StorageService] Retrying upload for image ${imageIndex} (attempt ${attempt + 1})`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        return this.uploadImage(captureId, imageIndex, base64Image, timestamp, attempt + 1)
      }
      
      throw new Error(`Failed to upload image ${imageIndex} after ${this.retryAttempts} attempts: ${error.message}`)
    }
  }

  /**
   * Upload multiple images with parallel processing and streaming updates
   * @param {string} captureId - The capture ID
   * @param {Array} images - Array of {index, image, timestamp} objects
   * @param {Function} onProgress - Progress callback (current, total)
   * @param {Function} onBatchComplete - Batch completion callback (results)
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadImageSequence(captureId, images, onProgress = null, onBatchComplete = null) {
    const total = images.length
    const results = []
    let completed = 0
    
    console.log(`[StorageService] Starting optimized upload of ${total} images for capture ${captureId}`)
    console.log(`[StorageService] Using ${this.maxConcurrentUploads} parallel uploads`)
    
    // Process images in parallel batches
    const uploadPromises = []
    const semaphore = new Array(this.maxConcurrentUploads).fill(null)
    
    for (let i = 0; i < images.length; i++) {
      const { index, image, timestamp } = images[i]
      
      // Wait for an available slot
      const uploadPromise = this.waitForSlot(semaphore).then(async (slotIndex) => {
        try {
          const result = await this.uploadImage(captureId, index, image, timestamp)
          
          const uploadResult = {
            index,
            timestamp,
            ...result,
            success: true
          }
          
          results.push(uploadResult)
          completed++
          
          // Call progress callback
          if (onProgress) {
            onProgress(completed, total)
          }
          
          // Call batch completion callback every 10 uploads for streaming updates
          if (onBatchComplete && completed % 10 === 0) {
            onBatchComplete([...results]) // Send copy of current results
          }
          
          return uploadResult
          
        } catch (error) {
          console.error(`[StorageService] Failed to upload image ${index}:`, error)
          const errorResult = {
            index,
            timestamp,
            success: false,
            error: error.message
          }
          
          results.push(errorResult)
          completed++
          
          if (onProgress) {
            onProgress(completed, total)
          }
          
          return errorResult
        } finally {
          // Release the slot
          semaphore[slotIndex] = null
        }
      })
      
      uploadPromises.push(uploadPromise)
    }
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises)
    
    // Final batch completion callback
    if (onBatchComplete) {
      onBatchComplete([...results])
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`[StorageService] Upload complete: ${successCount}/${total} images uploaded successfully`)
    
    return results
  }

  /**
   * Wait for an available upload slot (semaphore implementation)
   * @param {Array} semaphore - Array representing available slots
   * @returns {Promise<number>} Available slot index
   */
  async waitForSlot(semaphore) {
    return new Promise((resolve) => {
      const checkSlot = () => {
        const availableSlot = semaphore.findIndex(slot => slot === null)
        if (availableSlot !== -1) {
          semaphore[availableSlot] = true // Mark slot as occupied
          resolve(availableSlot)
        } else {
          // No slots available, check again in 10ms
          setTimeout(checkSlot, 10)
        }
      }
      checkSlot()
    })
  }

  /**
   * Delete all images for a capture
   * @param {string} captureId - The capture ID
   * @returns {Promise<void>}
   */
  async deleteCapture(captureId) {
    try {
      const captureRef = ref(storage, `captures/${captureId}`)
      const listResult = await listAll(captureRef)
      
      console.log(`[StorageService] Deleting ${listResult.items.length} images for capture ${captureId}`)
      
      // Delete files in parallel batches
      const deletePromises = []
      for (let i = 0; i < listResult.items.length; i += this.maxConcurrentUploads) {
        const batch = listResult.items.slice(i, i + this.maxConcurrentUploads)
        const batchPromises = batch.map(itemRef => deleteObject(itemRef))
        deletePromises.push(Promise.all(batchPromises))
      }
      
      await Promise.all(deletePromises)
      
      console.log(`[StorageService] Successfully deleted all images for capture ${captureId}`)
    } catch (error) {
      console.error(`[StorageService] Error deleting capture ${captureId}:`, error)
      throw new Error(`Failed to delete capture images: ${error.message}`)
    }
  }

  /**
   * Get storage usage statistics
   * @param {string} captureId - The capture ID
   * @returns {Promise<{fileCount: number, totalSize: number}>}
   */
  async getCaptureStats(captureId) {
    try {
      const captureRef = ref(storage, `captures/${captureId}`)
      const listResult = await listAll(captureRef)
      
      return {
        fileCount: listResult.items.length,
        totalSize: 0 // Avoid expensive metadata calls for now
      }
    } catch (error) {
      console.error(`[StorageService] Error getting capture stats:`, error)
      return { fileCount: 0, totalSize: 0 }
    }
  }
}

// Create and export a singleton instance
export const storageService = new StorageService()

// Export the class for testing or multiple instances if needed
export { StorageService } 