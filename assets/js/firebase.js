// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC19H2qQWAzvPqPYtjZkIquWirCqrOlIUk",
  authDomain: "dprintapp-710a8.firebaseapp.com",
  projectId: "dprintapp-710a8",
  storageBucket: "dprintapp-710a8.firebasestorage.app",
  messagingSenderId: "713699677790",
  appId: "1:713699677790:web:bcf5c670cedecb60c946cf"
};

let firebase = null;
let auth = null;
let db = null;

async function getFirebase() {
  if (!firebase) {
    console.log('[Firebase] Initializing Firebase...');
    console.log('[Firebase] firebase object:', typeof firebase);
    
    if (typeof firebase === 'undefined' || firebase === null) {
      throw new Error('Firebase SDK not loaded. Check if scripts are loaded in HTML.');
    }
    
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
    console.log('[Firebase] Firebase initialized successfully');
  }
  return { firebase, auth, db };
}
