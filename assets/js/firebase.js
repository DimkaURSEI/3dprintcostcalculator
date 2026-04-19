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
  if (window.firebaseInitialized) return;
  
  // Load Firebase App
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
  document.head.appendChild(appScript);
  
  await new Promise(resolve => appScript.onload = resolve);
  
  // Load Firebase Auth
  const authScript = document.createElement('script');
  authScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
  document.head.appendChild(authScript);
  
  await new Promise(resolve => authScript.onload = resolve);
  
  // Load Firebase Database
  const dbScript = document.createElement('script');
  dbScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';
  document.head.appendChild(dbScript);
  
  await new Promise(resolve => dbScript.onload = resolve);
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  window.firebaseInitialized = true;
  
  return firebase;
};

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
