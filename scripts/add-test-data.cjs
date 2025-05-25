const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

async function addTestData() {
  try {
    // Add test captures for the EEN user
    const testCaptures = [
      {
        id: 'capture1',
        name: 'Test Capture 1',
        eenUserEmailField: 'klaus+developer@klaushofrichter.net',
        createdAt: new Date(),
        description: 'This is a test capture for Firebase Custom Auth'
      },
      {
        id: 'capture2', 
        name: 'Test Capture 2',
        eenUserEmailField: 'klaus+developer@klaushofrichter.net',
        createdAt: new Date(),
        description: 'Another test capture'
      },
      {
        id: 'capture3',
        name: 'Different User Capture',
        eenUserEmailField: 'other@example.com',
        createdAt: new Date(),
        description: 'This should not be visible to the test user'
      }
    ];

    for (const capture of testCaptures) {
      await db.collection('captures').doc(capture.id).set(capture);
      console.log(`Added capture: ${capture.name}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData(); 