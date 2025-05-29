import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, writeBatch } from "firebase/firestore";
import app from '../firebase';
import securityService from './security';

/**
 * Optimized Database Service for Captures and Images
 * 
 * Uses two collections for scalability:
 * - captures: lightweight capture metadata
 * - capture_images: individual image documents
 */
class DatabaseService {
  constructor() {
    this.db = getFirestore(app);
  }

  // ========================================
  // CAPTURE OPERATIONS (Lightweight)
  // ========================================

  /**
   * Create a new capture document (without images)
   * @param {Object} captureData - Capture metadata
   * @returns {Promise<string>} Created capture ID
   */
  async createCapture(captureData) {
    try {
      // Validate and sanitize input using proper security service methods
      const sanitizedData = {
        name: securityService.sanitizeInput(captureData.name?.trim() || ''),
        description: securityService.sanitizeInput(captureData.description?.trim() || ''),
        cameraId: securityService.sanitizeInput(captureData.cameraId?.trim() || ''),
        startDate: securityService.sanitizeInput(captureData.startDate?.trim() || ''),
        duration: captureData.duration,
        interval: captureData.interval,
        eenUserEmailField: captureData.eenUserEmailField,
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: 'created',
        thumbnail: captureData.thumbnail || null
      };

      // Remove any images field if accidentally passed
      delete sanitizedData.images;

      const docRef = await addDoc(collection(this.db, "captures"), sanitizedData);
      
      console.log(`[DatabaseService] Created capture: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[DatabaseService] Error creating capture:', error);
      throw error;
    }
  }

  /**
   * Get all captures for a user
   * @param {string} userEmail - User's email
   * @returns {Promise<Array>} Array of capture documents
   */
  async getCaptures(userEmail) {
    try {
      const q = query(
        collection(this.db, "captures"), 
        where("eenUserEmailField", "==", userEmail)
        // Temporarily commenting out orderBy to avoid composite index requirement
        // orderBy("createdAt", "desc")
        // TODO: Uncomment after creating composite index in Firebase Console
      );
      
      const querySnapshot = await getDocs(q);
      const captures = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in JavaScript as temporary workaround
      captures.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log(`[DatabaseService] Retrieved ${captures.length} captures for user`);
      return captures;
    } catch (error) {
      console.error('[DatabaseService] Error fetching captures:', error);
      throw error;
    }
  }

  /**
   * Update capture metadata (progress, status, etc.)
   * @param {string} captureId - Capture ID
   * @param {Object} updates - Fields to update
   */
  async updateCapture(captureId, updates) {
    try {
      // Remove any images field if accidentally passed
      const sanitizedUpdates = { ...updates };
      delete sanitizedUpdates.images;

      const captureRef = doc(this.db, "captures", captureId);
      await updateDoc(captureRef, sanitizedUpdates);
      
      console.log(`[DatabaseService] Updated capture ${captureId}`);
    } catch (error) {
      console.error('[DatabaseService] Error updating capture:', error);
      throw error;
    }
  }

  /**
   * Delete a capture and all its images
   * @param {string} captureId - Capture ID
   */
  async deleteCapture(captureId) {
    try {
      // Delete all images first
      await this.deleteAllImages(captureId);
      
      // Delete the capture document
      const captureRef = doc(this.db, "captures", captureId);
      await deleteDoc(captureRef);
      
      console.log(`[DatabaseService] Deleted capture ${captureId} and all images`);
    } catch (error) {
      console.error('[DatabaseService] Error deleting capture:', error);
      throw error;
    }
  }

  // ========================================
  // IMAGE OPERATIONS (Scalable)
  // ========================================

  /**
   * Add multiple images to a capture (batch operation)
   * @param {string} captureId - Capture ID
   * @param {Array} imageDataArray - Array of image metadata objects
   * @param {string} userEmail - User's email for security
   */
  async addImages(captureId, imageDataArray, userEmail) {
    try {
      if (!imageDataArray || imageDataArray.length === 0) {
        return;
      }

      // Process in batches to avoid Firestore limits (500 operations per batch)
      const batchSize = 400; // Leave some room for safety
      const batches = [];
      
      for (let i = 0; i < imageDataArray.length; i += batchSize) {
        const batchData = imageDataArray.slice(i, i + batchSize);
        batches.push(batchData);
      }

      let totalAdded = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = writeBatch(this.db);
        const batchData = batches[batchIndex];

        batchData.forEach((imageData, index) => {
          // Create predictable document ID
          const imageId = `${captureId}_image-${String(imageData.index).padStart(4, '0')}`;
          const imageRef = doc(this.db, "capture_images", imageId);

          const sanitizedImageData = {
            captureId,
            index: imageData.index,
            timestamp: securityService.sanitizeInput(imageData.timestamp || ''),
            downloadUrl: securityService.sanitizeInput(imageData.downloadUrl || ''),
            storagePath: securityService.sanitizeInput(imageData.storagePath || ''),
            size: imageData.size || 0,
            uploadedAt: imageData.uploadedAt || new Date().toISOString(),
            eenUserEmailField: userEmail
          };

          batch.set(imageRef, sanitizedImageData);
        });

        await batch.commit();
        totalAdded += batchData.length;
        
        console.log(`[DatabaseService] Batch ${batchIndex + 1}/${batches.length}: Added ${batchData.length} images (Total: ${totalAdded}/${imageDataArray.length})`);
      }

      // Update capture with final image count
      await this.updateCapture(captureId, {
        imageCount: totalAdded,
        processedAt: new Date().toISOString(),
        status: 'completed'
      });

      console.log(`[DatabaseService] Successfully added ${totalAdded} images to capture ${captureId}`);
    } catch (error) {
      console.error('[DatabaseService] Error adding images:', error);
      throw error;
    }
  }

  /**
   * Get images for a capture with pagination
   * @param {string} captureId - Capture ID
   * @param {Object} options - Query options { limit, startAfterIndex, orderBy }
   * @returns {Promise<Array>} Array of image documents
   */
  async getImages(captureId, options = {}) {
    try {
      const {
        limit: limitCount = 50,
        startAfterIndex = null,
        orderBy: orderField = 'index'
      } = options;

      let q = query(
        collection(this.db, "capture_images"),
        where("captureId", "==", captureId),
        orderBy(orderField),
        limit(limitCount)
      );

      // Add pagination if specified
      if (startAfterIndex !== null) {
        // For index-based pagination, we need to get the document to start after
        const startAfterImageId = `${captureId}_image-${String(startAfterIndex).padStart(4, '0')}`;
        const startAfterDoc = await getDoc(doc(this.db, "capture_images", startAfterImageId));
        if (startAfterDoc.exists()) {
          q = query(q, startAfter(startAfterDoc));
        }
      }

      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[DatabaseService] Retrieved ${images.length} images for capture ${captureId}`);
      return images;
    } catch (error) {
      console.error('[DatabaseService] Error fetching images:', error);
      throw error;
    }
  }

  /**
   * Get images in a specific timestamp range
   * @param {string} captureId - Capture ID
   * @param {string} startTime - ISO timestamp
   * @param {string} endTime - ISO timestamp
   * @returns {Promise<Array>} Array of image documents
   */
  async getImagesByTimeRange(captureId, startTime, endTime) {
    try {
      const q = query(
        collection(this.db, "capture_images"),
        where("captureId", "==", captureId),
        where("timestamp", ">=", startTime),
        where("timestamp", "<=", endTime),
        orderBy("timestamp")
      );

      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[DatabaseService] Retrieved ${images.length} images in time range`);
      return images;
    } catch (error) {
      console.error('[DatabaseService] Error fetching images by time range:', error);
      throw error;
    }
  }

  /**
   * Delete all images for a capture
   * @param {string} captureId - Capture ID
   */
  async deleteAllImages(captureId) {
    try {
      // Get all images for this capture
      const q = query(
        collection(this.db, "capture_images"),
        where("captureId", "==", captureId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`[DatabaseService] No images found for capture ${captureId}`);
        return;
      }

      // Delete in batches
      const batchSize = 400;
      const docs = querySnapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(this.db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`[DatabaseService] Deleted batch of ${batchDocs.length} images`);
      }

      console.log(`[DatabaseService] Deleted ${docs.length} images for capture ${captureId}`);
    } catch (error) {
      console.error('[DatabaseService] Error deleting images:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get capture statistics (image count, size, etc.)
   * @param {string} captureId - Capture ID
   * @returns {Promise<Object>} Statistics object
   */
  async getCaptureStats(captureId) {
    try {
      const q = query(
        collection(this.db, "capture_images"),
        where("captureId", "==", captureId)
      );

      const querySnapshot = await getDocs(q);
      
      let totalSize = 0;
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalSize += data.size || 0;
      });

      return {
        imageCount: querySnapshot.size,
        totalSize,
        averageSize: querySnapshot.size > 0 ? Math.round(totalSize / querySnapshot.size) : 0
      };
    } catch (error) {
      console.error('[DatabaseService] Error getting capture stats:', error);
      return { imageCount: 0, totalSize: 0, averageSize: 0 };
    }
  }
}

// Create and export singleton instance
export const databaseService = new DatabaseService();

// Export class for testing
export { DatabaseService }; 