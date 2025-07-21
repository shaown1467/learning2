import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email === 'admin@admin.com';

  const login = async (email: string, password: string) => {
    try {
      // Check if user is already logged in on another device
      const sessionQuery = query(
        collection(db, 'userSessions'),
        where('email', '==', email)
      );
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (!sessionSnapshot.empty) {
        // User is already logged in on another device
        const existingSession = sessionSnapshot.docs[0];
        const sessionData = existingSession.data();
        
        // Check if session is still active (less than 24 hours old)
        const sessionTime = sessionData.createdAt?.toDate();
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          throw new Error('এই অ্যাকাউন্ট অন্য ডিভাইসে লগইন করা আছে। প্রথমে সেখান থেকে লগআউট করুন।');
        } else {
          // Remove old session
          await deleteDoc(existingSession.ref);
        }
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      
      // Create new session record
      const user = getAuth().currentUser;
      if (user) {
        await setDoc(doc(db, 'userSessions', user.uid), {
          email: user.email,
          userId: user.uid,
          createdAt: new Date(),
          deviceInfo: navigator.userAgent
        });
      }
      
      toast.success('সফলভাবে লগইন হয়েছে!');
    } catch (error: any) {
      if (error.message.includes('অন্য ডিভাইসে')) {
        toast.error(error.message);
      } else {
        toast.error('লগইন করতে সমস্যা হয়েছে!');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Remove session record
      if (currentUser) {
        await deleteDoc(doc(db, 'userSessions', currentUser.uid));
      }
      
      await signOut(auth);
      toast.success('সফলভাবে লগআউট হয়েছে!');
    } catch (error: any) {
      toast.error('লগআউট করতে সমস্যা হয়েছে!');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};