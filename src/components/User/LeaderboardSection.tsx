import React, { useState } from 'react';
import { Trophy, Medal, Award, User, Edit, Camera } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';
import toast from 'react-hot-toast';

const LeaderboardSection: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents: profiles, addDocument, updateDocument } = useFirestore('userProfiles', 'points');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    avatar: ''
  });

  const currentUserProfile = profiles.find((profile: UserProfile) => profile.userId === currentUser?.uid);

  const openProfileModal = () => {
    if (currentUserProfile) {
      setProfileForm({
        displayName: currentUserProfile.displayName || '',
        bio: currentUserProfile.bio || '',
        avatar: currentUserProfile.avatar || ''
      });
    } else {
      setProfileForm({
        displayName: currentUser?.email?.split('@')[0] || '',
        bio: '',
        avatar: ''
      });
    }
    setIsProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      const profileData = {
        userId: currentUser.uid,
        ...profileForm,
        points: currentUserProfile?.points || 0,
        completedVideos: currentUserProfile?.completedVideos || 0,
        joinedAt: currentUserProfile?.joinedAt || new Date(),
        updatedAt: new Date()
      };

      if (currentUserProfile) {
        await updateDocument(currentUserProfile.id, profileData);
      } else {
        await addDocument(profileData);
      }
      
      toast.success('প্রোফাইল আপডেট হয়েছে!');
      setIsProfileModalOpen(false);
    } catch (error) {
      toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে!');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-500" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  const sortedProfiles = [...profiles].sort((a: UserProfile, b: UserProfile) => b.points - a.points);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">লিডারবোর্ড</h1>
        <p className="text-gray-600">শীর্ষ শিক্ষার্থীদের তালিকা এবং আপনার অবস্থান দেখুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">শীর্ষ শিক্ষার্থী</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {sortedProfiles.map((profile: UserProfile, index) => {
                const rank = index + 1;
                const isCurrentUser = profile.userId === currentUser?.uid;
                
                return (
                  <div
                    key={profile.id}
                    className={`p-6 flex items-center space-x-4 ${
                      isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {profile.displayName}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            আপনি
                          </span>
                        )}
                      </div>
                      {profile.bio && (
                        <p className="text-sm text-gray-600 truncate">{profile.bio}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {profile.completedVideos} টি ভিডিও সম্পূর্ণ
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-white font-semibold ${getRankBadge(rank)}`}>
                        {profile.points} পয়েন্ট
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {sortedProfiles.length === 0 && (
                <div className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">এখনো কোন র‍্যাঙ্কিং নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">আপনার প্রোফাইল</h3>
              <button
                onClick={openProfileModal}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            
            {currentUserProfile ? (
              <div className="text-center">
                <div className="mb-4">
                  {currentUserProfile.avatar ? (
                    <img
                      src={currentUserProfile.avatar}
                      alt={currentUserProfile.displayName}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto">
                      <User className="h-10 w-10 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentUserProfile.displayName}
                </h4>
                
                {currentUserProfile.bio && (
                  <p className="text-gray-600 mb-4">{currentUserProfile.bio}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">{currentUserProfile.points}</p>
                    <p className="text-sm text-gray-600">পয়েন্ট</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{currentUserProfile.completedVideos}</p>
                    <p className="text-sm text-gray-600">ভিডিও</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    র‍্যাঙ্ক: #{sortedProfiles.findIndex(p => p.userId === currentUser?.uid) + 1}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">প্রোফাইল তৈরি করুন</p>
                <button
                  onClick={openProfileModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  প্রোফাইল সেটআপ করুন
                </button>
              </div>
            )}
          </div>

          {/* Achievement Badges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">অর্জন</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'প্রথম ভিডিও', icon: '🎬', earned: true },
                { title: '১০ ভিডিও', icon: '📚', earned: false },
                { title: '১০০ পয়েন্ট', icon: '⭐', earned: true },
                { title: 'টপ ১০', icon: '🏆', earned: false },
              ].map((badge, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center ${
                    badge.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className={`text-xs font-medium ${
                    badge.earned ? 'text-yellow-800' : 'text-gray-500'
                  }`}>
                    {badge.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">প্রোফাইল আপডেট করুন</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  নাম
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="আপনার নাম লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বায়ো
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  প্রোফাইল ছবির লিংক
                </label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  আপডেট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardSection;