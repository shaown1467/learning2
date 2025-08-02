import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyCwXCs0LEzqpO4lfWvXR6dGIQm8Nb-9FYc",
  authDomain: "gen-lang-client-0848034244.firebaseapp.com",
  projectId: "gen-lang-client-0848034244",
  storageBucket: "gen-lang-client-0848034244.firebasestorage.app",
  messagingSenderId: "511888474862",
  appId: "1:511888474862:web:67ad0a998ed2f84e75a9ff",
  measurementId: "G-6L7CVRRB1J"
};

// অ্যাপ ইনিশিয়ালাইজ করুন
const app: FirebaseApp = initializeApp(firebaseConfig);

// App Check ইনিশিয়ালাইজ করুন
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcdXpgrAAAAAIiz9-fGWa8MjbJ8CeUF0SNONMWgJ'),
    isTokenAutoRefreshEnabled: true
  });
}

// সার্ভিসগুলো ইনিশিয়ালাইজ করুন
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// সার্ভিসগুলো এক্সপোর্ট করুন
export { app, auth, db, storage };