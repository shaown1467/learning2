import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { UserStats } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalVideos: 0,
    totalTopics: 0,
    totalPosts: 0,
    totalEvents: 0,
    averageProgress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    fetchStats();
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Count users
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Count videos
      const { count: videosCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      // Count topics
      const { count: topicsCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });

      // Count posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Count events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalVideos: videosCount || 0,
        totalTopics: topicsCount || 0,
        totalPosts: postsCount || 0,
        totalEvents: eventsCount || 0,
        averageProgress: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };
  return { stats, loading };
};