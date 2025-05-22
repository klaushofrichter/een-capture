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
// Removed unused import: const { onRequest } =
//    require("firebase-functions/v2/https");
// Import onCall and https from the v2 https module
const { onCall, https } =
  require("firebase-functions/v2/https"); // Fixed max-len

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// This function fetches all documents from the 'documents' collection.
// Changed from onRequest to onCall for compatibility with httpsCallable.
exports.getAllDocuments = onCall(async (request) => {
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
    throw new https.CallableError("internal",
        error.message || "An error occurred while fetching documents.",
    );
  }
});
