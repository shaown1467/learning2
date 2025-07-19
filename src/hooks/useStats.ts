import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserStats } from '../types';

export const useStats = () => {
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
    const unsubscribes: (() => void)[] = [];

    // Count users
    const usersQuery = query(collection(db, 'userProfiles'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });
    unsubscribes.push(unsubUsers);

    // Count videos
    const videosQuery = query(collection(db, 'videos'));
    const unsubVideos = onSnapshot(videosQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalVideos: snapshot.size }));
    });
    unsubscribes.push(unsubVideos);

    // Count topics
    const topicsQuery = query(collection(db, 'topics'));
    const unsubTopics = onSnapshot(topicsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalTopics: snapshot.size }));
    });
    unsubscribes.push(unsubTopics);

    // Count posts
    const postsQuery = query(collection(db, 'posts'));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalPosts: snapshot.size }));
    });
    unsubscribes.push(unsubPosts);

    // Count events
    const eventsQuery = query(collection(db, 'events'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalEvents: snapshot.size }));
      setLoading(false);
    });
    unsubscribes.push(unsubEvents);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  return { stats, loading };
};