import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwXCs0LEzqpO4lfWvXR6dGIQm8Nb-9FYc",
  authDomain: "gen-lang-client-0848034244.firebaseapp.com",
  projectId: "gen-lang-client-0848034244",
  storageBucket: "gen-lang-client-0848034244.firebasestorage.app",
  messagingSenderId: "511888474862",
  appId: "1:511888474862:web:67ad0a998ed2f84e75a9ff",
  measurementId: "G-6L7CVRRBLJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;