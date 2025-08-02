import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// অ্যাপটি আগে ইনিশিয়ালাইজ করা হয়েছে কিনা তা পরীক্ষা করুন
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// App Check শুধুমাত্র ব্রাউজারে ইনিশিয়ালাইজ করুন
if (typeof window !== 'undefined') {
  try {
    // এখানে app._alreadyInitialized property চেক করা অপ্রয়োজনীয়, 
    // কারণ initializeAppCheck নিজেই এটি হ্যান্ডেল করে।
    // আমরা সরাসরি initializeAppCheck কল করব।
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LcdXpgrAAAAAIiz9-fGWa8MjbJ8CeUF0SNONMWgJ'),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // যদি initializeAppCheck একাধিকবার কল হয়, তাহলে এই এররটি আসবে।
    // আমরা এটিকে এখানে নিরাপদে ইগনোর করতে পারি কারণ অ্যাপটি অলরেডি কনফিগার করা আছে।
    if (String(error).includes('appCheck/already-initialized')) {
      console.warn('Firebase App Check has already been initialized.');
    } else {
      console.error('Error initializing Firebase App Check:', error);
    }
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app }; // app এক্সপোর্ট করা হলো