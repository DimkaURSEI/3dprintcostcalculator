// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC19H2qQWAzvPqPYtjZkIquWirCqrOlIUk",
  authDomain: "dprintapp-710a8.firebaseapp.com",
  projectId: "dprintapp-710a8",
  storageBucket: "dprintapp-710a8.firebasestorage.app",
  messagingSenderId: "713699677790",
  appId: "1:713699677790:web:bcf5c670cedecb60c946cf"
};

// Load Firebase SDK from CDN
const loadFirebase = async () => {
  if (window.firebaseInitialized) return window.firebase;
  
  // Load Firebase App
  await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  
  // Load Firebase Auth
  await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');
  
  // Load Firebase Database
  await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');
  
  // Initialize Firebase
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.firebaseInitialized = true;
    return firebase;
  } else {
    throw new Error('Firebase SDK failed to load');
  }
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

let firebase = null;
let auth = null;
let db = null;

async function getFirebase() {
  if (!firebase) {
    firebase = await loadFirebase();
    auth = firebase.auth();
    db = firebase.database();
  }
  return { firebase, auth, db };
}
