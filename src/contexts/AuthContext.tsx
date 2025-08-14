import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email === 'admin@admin.com';

  const login = async (email: string, password: string) => {
    try {
      // Check if user is already logged in on another device
      const { data: existingSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('email', email);

      if (existingSessions && existingSessions.length > 0) {
        const existingSession = existingSessions[0];
        const sessionTime = new Date(existingSession.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          throw new Error('এই অ্যাকাউন্ট অন্য ডিভাইসে লগইন করা আছে। প্রথমে সেখান থেকে লগআউট করুন।');
        } else {
          // Remove old session
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', existingSession.id);
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create new session record
        await supabase
          .from('user_sessions')
          .insert({
            user_id: data.user.id,
            email: data.user.email,
            device_info: navigator.userAgent
          });

        // Create or update user profile
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (!existingProfile) {
          await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              display_name: data.user.email?.split('@')[0] || 'ব্যবহারকারী',
              points: 0,
              completed_videos: 0
            });
        }
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
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', currentUser.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('সফলভাবে লগআউট হয়েছে!');
    } catch (error: any) {
      toast.error('লগআউট করতে সমস্যা হয়েছে!');
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    session,
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