import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// App Check-এর জন্য নতুন দুটি লাইন নিচে যোগ করা হয়েছে
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyCwXCs0LEzqpO4lfWvXR6dGIQm8Nb-9FYc",
  authDomain: "gen-lang-client-0848034244.firebaseapp.com",
  projectId: "gen-lang-client-0848034244",
  storageBucket: "gen-lang-client-0848034244.firebasestorage.app",
  messagingSenderId: "511888474862",
  appId: "1:511888474862:web:67ad0a998ed2f84e75a9ff",
  measurementId: "G-6L7CVRRB1J"
};

const app = initializeApp(firebaseConfig);

// App Check ইনিশিয়ালাইজ করার জন্য এই কোডটুকু যোগ করা হয়েছে
if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    // আপনার Site Key এখানে সরাসরি বসিয়ে দেওয়া হয়েছে
    provider: new ReCaptchaV3Provider('6LcdXpgrAAAAAIIz9-fGWaBMjJBCeUF0SNONMWgJ'),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;