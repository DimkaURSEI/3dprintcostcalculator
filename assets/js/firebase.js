// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAftZelopjfPRrZRXc6zNIeK68LK2aiw9k",
  authDomain: "d-print-calc-fdd82.firebaseapp.com",
  projectId: "d-print-calc-fdd82",
  storageBucket: "d-print-calc-fdd82.firebasestorage.app",
  messagingSenderId: "610943004818",
  appId: "1:610943004818:web:44f7feece65ad580a4764b",
  measurementId: "G-WG9H3FHZEM"
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
