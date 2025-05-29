#!/usr/bin/env node

/**
 * Cleanup script to remove all existing captures and storage files
 * Run this to start fresh with the new optimized database structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjZCRF4zTxj_YzgDlTZJlPHQnqJnlWyIY",
  authDomain: "klaus-hofrichter-simple.firebaseapp.com",
  projectId: "klaus-hofrichter-simple",
  storageBucket: "klaus-hofrichter-simple.appspot.com",
  messagingSenderId: "901913639945",
  appId: "1:901913639945:web:f1cde60d7b7d5e6f8c2a3b"
};

async function cleanupCaptures() {
  console.log('🧹 Starting cleanup of existing captures...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const auth = getAuth(app);
    
    console.log('🔑 Note: This cleanup operates with limited permissions');
    console.log('   If you have many captures, you may need to run this multiple times');
    
    // 1. Get all captures (limited by security rules to authenticated user)
    console.log('📋 Fetching captures...');
    const capturesRef = collection(db, 'captures');
    let capturesSnapshot;
    
    try {
      capturesSnapshot = await getDocs(capturesRef);
      console.log(`Found ${capturesSnapshot.size} captures to clean up`);
    } catch (permissionError) {
      console.log('⚠️  Cannot access captures collection (requires authentication)');
      console.log('   Please delete captures manually through the web interface');
      return;
    }
    
    // 2. Delete storage files for each capture (if possible)
    for (const captureDoc of capturesSnapshot.docs) {
      const captureId = captureDoc.id;
      console.log(`🗂️  Processing capture: ${captureId}`);
      
      try {
        // List all files in the capture's storage folder
        const captureStorageRef = ref(storage, `captures/${captureId}`);
        const listResult = await listAll(captureStorageRef);
        
        if (listResult.items.length > 0) {
          console.log(`  📁 Deleting ${listResult.items.length} storage files...`);
          await Promise.all(listResult.items.map(fileRef => deleteObject(fileRef)));
          console.log(`  ✅ Storage files deleted for ${captureId}`);
        } else {
          console.log(`  ℹ️  No storage files found for ${captureId}`);
        }
      } catch (storageError) {
        console.warn(`  ⚠️  Storage cleanup failed for ${captureId}:`, storageError.message);
      }
    }
    
    // 3. Delete all capture documents
    if (capturesSnapshot.size > 0) {
      console.log('📄 Deleting capture documents...');
      
      // Process in batches of 500 (Firestore limit)
      const docs = capturesSnapshot.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + 500);
        
        batchDocs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        
        await batch.commit();
        console.log(`  ✅ Deleted batch of ${batchDocs.length} capture documents`);
      }
    }
    
    // 4. Clean up any existing capture_images collection (if it exists)
    console.log('🖼️  Checking for existing capture_images collection...');
    try {
      const imagesRef = collection(db, 'capture_images');
      const imagesSnapshot = await getDocs(imagesRef);
      
      if (imagesSnapshot.size > 0) {
        console.log(`📄 Deleting ${imagesSnapshot.size} image documents...`);
        
        // Process in batches of 500
        const imageDocs = imagesSnapshot.docs;
        for (let i = 0; i < imageDocs.length; i += 500) {
          const batch = writeBatch(db);
          const batchDocs = imageDocs.slice(i, i + 500);
          
          batchDocs.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });
          
          await batch.commit();
          console.log(`  ✅ Deleted batch of ${batchDocs.length} image documents`);
        }
      } else {
        console.log('ℹ️  No existing capture_images collection found');
      }
    } catch (imagesError) {
      console.warn('⚠️  Could not access capture_images collection:', imagesError.message);
    }
    
    console.log('🎉 Cleanup completed successfully!');
    console.log('');
    console.log('🆕 Ready for new optimized database structure:');
    console.log('   - captures collection: lightweight capture metadata');
    console.log('   - capture_images collection: individual image documents');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('');
    console.log('💡 Alternatives:');
    console.log('   1. Delete captures manually through the web interface');
    console.log('   2. Use Firebase Console to delete collections');
    console.log('   3. Contact your Firebase admin for cleanup');
    process.exit(1);
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupCaptures().then(() => {
    console.log('✨ Cleanup script completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
}

export { cleanupCaptures }; 