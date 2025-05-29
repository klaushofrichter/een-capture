/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at
 * https://firebase.google.com/docs/functions
 */

// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { logger } = require("firebase-functions");
// Import CallableError from the correct location
const { onCall, HttpsError } = require("firebase-functions/v2/https");
// Removed unused import: const { onRequest } =
//    require("firebase-functions/v2/https")

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  let previousLength;
  
  // Keep sanitizing until no more changes occur (handles overlapping patterns)
  do {
    previousLength = sanitized.length;
    
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols (global)
      .replace(/data:/gi, '') // Remove data: protocols (global)
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols (global)
      .replace(/file:/gi, '') // Remove file: protocols (global)
      .replace(/about:/gi, '') // Remove about: protocols (global)
      .replace(/on\s*\w*\s*=/gi, '') // Remove event handlers with optional spaces (global)
      // More precise event handler detection - only remove 'on' when followed by common event names
      .replace(/\bon(click|load|error|focus|blur|change|submit|reset|mouseover|mouseout|keydown|keyup|keypress)(?=\W|$)/gi, '')
      .replace(/\s+on\s+/gi, ' ') // Remove standalone 'on' with spaces
      .replace(/\bon\s(?=\w)/gi, ' ') // Remove 'on' followed by space and word (but not at end)
      .replace(/\s+on$/gi, ' ') // Remove 'on' at end of string with spaces
      .replace(/^on\s/gi, '') // Remove 'on' at start of string followed by space
      // Only remove exact 'on' word, not 'on' within other words
      .replace(/\bon\b(?=\s|$)/gi, '') // Remove standalone 'on' word only when followed by space or end
      .replace(/^on$/gi, '') // Remove if string is exactly 'on'
      .replace(/&[#\w]+;/g, '') // Remove HTML entities that could be used for encoding
      .replace(/[\p{Cc}]/gu, '') // Remove control characters using Unicode property
      .trim();
      
  } while (sanitized.length !== previousLength && sanitized.length > 0);
  
  return sanitized;
}

/**
 * Validate URL scheme to prevent dangerous protocols
 */
function validateUrlScheme(url) {
  if (typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    const allowedSchemes = ['http:', 'https:'];
    
    if (!allowedSchemes.includes(urlObj.protocol)) {
      logger.warn(`Blocked dangerous URL scheme: ${urlObj.protocol}`);
      return false;
    }
    
    return true;
  } catch {
    // Invalid URL format
    logger.warn(`Invalid URL format: ${url}`);
    return false;
  }
}

// This function fetches all documents from the 'documents' collection.
// Changed from onRequest to onCall for compatibility with httpsCallable.
exports.getAllDocuments = onCall(async () => {
  try {
    // Optional: Check authentication if needed
    // if (!request.auth) {
    //   throw new https.CallableError('unauthenticated',
    //     'User must be authenticated to fetch documents.'); // Fixed max-len
    // }

    const documentsSnapshot = await db.collection("documents").get();
    const documents = [];
    documentsSnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    // onCall functions automatically wrap the return value in { data: ... }
    return documents;
  } catch (error) {
    logger.error("Error fetching documents:", error);
    // Re-throw error as a CallableError to be sent back to the client
    throw new HttpsError("internal",
        error.message || "An error occurred while fetching documents.",
    );
  }
});

/**
 * Creates a custom Firebase authentication token for an EEN user
 * @param {Object} request - The function request containing user data
 * @param {string} request.data.eenUserId - The EEN user ID
 * @param {string} request.data.eenUserEmail - The EEN user email
 * @param {string} request.data.eenAccessToken - EEN access token
 * @param {string} request.data.eenBaseUrl - EEN base URL for API calls
 * @param {Object} request.data.additionalClaims - Additional claims
 * @returns {Promise<string>} Custom Firebase token
 */
exports.createCustomToken = onCall(async (request) => {
  try {
    const {
      eenUserId,
      eenUserEmail,
      eenAccessToken,
      eenBaseUrl,
      additionalClaims = {},
    } = request.data;

    // Validate required parameters
    if (!eenUserId || !eenUserEmail || !eenAccessToken || !eenBaseUrl) {
      throw new HttpsError(
          "invalid-argument",
          "Missing required parameters: eenUserId, eenUserEmail, eenAccessToken, or eenBaseUrl",
      );
    }

    // Sanitize input parameters
    const sanitizedEenUserId = sanitizeInput(eenUserId);
    const sanitizedEenUserEmail = sanitizeInput(eenUserEmail);
    const sanitizedEenAccessToken = sanitizeInput(eenAccessToken);
    const sanitizedEenBaseUrl = sanitizeInput(eenBaseUrl);

    // Validate URL scheme for base URL
    if (!validateUrlScheme(sanitizedEenBaseUrl)) {
      throw new HttpsError(
          "invalid-argument",
          "Invalid or unsafe EEN base URL",
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEenUserEmail)) {
      throw new HttpsError(
          "invalid-argument",
          "Invalid email format",
      );
    }

    // Verify the EEN access token and email by calling EEN API
    logger.info("Verifying EEN user email with EEN API:", {
      eenUserId: sanitizedEenUserId,
      eenUserEmail: sanitizedEenUserEmail,
      eenBaseUrl: sanitizedEenBaseUrl,
    });

    try {
      // Import axios for making HTTP requests
      const axios = require("axios");
      
      // Call EEN API to get user profile
      const eenApiResponse = await axios.get(`${sanitizedEenBaseUrl}/api/v3.0/users/self`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${sanitizedEenAccessToken}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // Check if the API call was successful
      if (eenApiResponse.status !== 200) {
        throw new HttpsError(
            "unauthenticated",
            `EEN API returned status ${eenApiResponse.status}`,
        );
      }

      // Extract email from EEN API response
      const eenApiUserData = eenApiResponse.data;
      const eenApiEmail = eenApiUserData.email;

      if (!eenApiEmail) {
        throw new HttpsError(
            "internal",
            "EEN API response does not contain email field",
        );
      }

      // Verify that the email from EEN API matches the provided email
      if (eenApiEmail.toLowerCase() !== sanitizedEenUserEmail.toLowerCase()) {
        logger.error("Email mismatch:", {
          providedEmail: sanitizedEenUserEmail,
          eenApiEmail: eenApiEmail,
        });
        throw new HttpsError(
            "permission-denied",
            "Email verification failed: provided email does not match EEN user email",
        );
      }

      logger.info("EEN email verification successful:", {
        eenUserId: sanitizedEenUserId,
        verifiedEmail: eenApiEmail,
      });

    } catch (error) {
      // Handle different types of errors
      if (error.code && error.code.startsWith("functions/")) {
        // Re-throw HttpsError as-is
        throw error;
      }
      
      if (error.response) {
        // Axios error with response
        logger.error("EEN API error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        
        if (error.response.status === 401) {
          throw new HttpsError(
              "unauthenticated",
              "EEN access token is invalid or expired",
          );
        } else if (error.response.status === 403) {
          throw new HttpsError(
              "permission-denied",
              "EEN access token does not have permission to access user profile",
          );
        } else {
          throw new HttpsError(
              "internal",
              `EEN API error: ${error.response.status} ${error.response.statusText}`,
          );
        }
      } else if (error.request) {
        // Network error
        logger.error("Network error calling EEN API:", error.message);
        throw new HttpsError(
            "unavailable",
            "Unable to connect to EEN API for email verification",
        );
      } else {
        // Other error
        logger.error("Unexpected error during EEN API call:", error.message);
        throw new HttpsError(
            "internal",
            `Email verification failed: ${error.message}`,
        );
      }
    }

    logger.info("Creating custom token for EEN user:", {
      eenUserId: sanitizedEenUserId,
      eenUserEmail: sanitizedEenUserEmail,
    });

    // Create custom claims
    const customClaims = {
      eenUserId: sanitizedEenUserId,
      eenUserEmail: sanitizedEenUserEmail,
      provider: "een",
      ...additionalClaims,
    };

    // Use EEN user ID as the Firebase UID to ensure consistency
    const firebaseUid = `een_${sanitizedEenUserId}`;

    // Create or update user record in Firebase Auth
    try {
      await adminAuth.getUser(firebaseUid);
      // User exists, update the record
      await adminAuth.updateUser(firebaseUid, {
        email: sanitizedEenUserEmail,
        emailVerified: true,
        customClaims,
      });
      logger.info("Updated existing Firebase user:", firebaseUid);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // User doesn't exist, create new user
        await adminAuth.createUser({
          uid: firebaseUid,
          email: sanitizedEenUserEmail,
          emailVerified: true,
          customClaims,
        });
        logger.info("Created new Firebase user:", firebaseUid);
      } else {
        throw error;
      }
    }

    // Generate custom token
    const customToken = await adminAuth.createCustomToken(
        firebaseUid,
        customClaims,
    );

    logger.info("Custom token created successfully for user:", firebaseUid);
    return { customToken, firebaseUid };
  } catch (error) {
    logger.error("Error creating custom token:", error);

    if (error.code && error.code.startsWith("auth/")) {
      throw new HttpsError(
          "unauthenticated",
          error.message,
      );
    }

    throw new HttpsError(
        "internal",
        `Failed to create custom token: ${error.message}`,
    );
  }
});
