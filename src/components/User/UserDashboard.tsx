import React, { useState } from 'react';
import { Play, BookOpen, Award, Clock, MessageSquare, Calendar, Trophy, Download, File, Menu, X, Home, Users, Target } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useStats } from '../../hooks/useStats';
import { Topic, Video, UserProgress } from '../../types';
import { getThumbnailUrl } from '../../utils/youtube';
import { formatFileSize, getFileIcon } from '../../utils/fileUpload';
import VideoPlayer from './VideoPlayer';
import { CommunitySection } from './CommunitySection';
import CalendarSection from './CalendarSection';
import ChallengeSection from './ChallengeSection';
import LeaderboardSection from './LeaderboardSection';
import Navbar from '../Layout/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const UserDashboard: React.FC = () => {
  const { documents: topics } = useFirestore('topics', 'order');
  const { documents: videos } = useFirestore('videos', 'order');
  const { documents: userProgress, addDocument: addProgress } = useFirestore('userProgress');
  const { stats } = useStats();
  const [activeSection, setActiveSection] = useState('courses');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleVideoSelect = async (video: Video) => {
    if (!currentUser) return;
    
    // Check if user progress exists, create if not
    const userVideoProgress = userProgress.find((progress: UserProgress) => 
      progress.userId === currentUser.uid && progress.videoId === video.id
    );
    
    if (!userVideoProgress) {
      
      try {
        await addProgress({
          userId: currentUser.uid,
          videoId: video.id,
          watched: false,
          canAccess: true, // All videos are now accessible
          summary: '',
          workLink: '',
          quizPassed: false,
          quizAttempts: 0
        });
      } catch (error) {
        console.error('Error creating progress:', error);
      }
    }
    
    setSelectedVideo(video);
  };
  
  const handleVideoComplete = () => {
    // Refresh the page or update state to reflect completion
    setSelectedVideo(null);
    // You might want to refresh user progress here
  };

  const getTopicVideos = (topicId: string) => {
    return videos.filter((video: Video) => video.topicId === topicId);
  };

  const getTopicProgress = (topicId: string) => {
    const topicVideos = getTopicVideos(topicId);
    // This would calculate actual progress based on user's completed videos
    return Math.floor(Math.random() * 100); // Placeholder
  };

  const getTotalDuration = () => {
    // Calculate total duration from all videos (placeholder)
    return videos.length * 15; // Assuming 15 minutes per video
  };

  const navigationItems = [
    { id: 'courses', label: 'কোর্স', icon: BookOpen },
    { id: 'community', label: 'কমিউনিটি', icon: MessageSquare },
    { id: 'challenges', label: 'চ্যালেঞ্জ', icon: Trophy },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
    { id: 'leaderboard', label: 'লিডারবোর্ড', icon: Award },
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSelectedTopic(null);
    setSelectedVideo(null);
    setIsMobileMenuOpen(false);
  };

  // If a specific section is selected, render that section
  if (activeSection === 'community') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white shadow-sm border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-8 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <CommunitySection />
        </div>
      </div>
    );
  }

  if (activeSection === 'challenges') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white shadow-sm border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-8 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <ChallengeSection />
        </div>
      </div>
    );
  }

  if (activeSection === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white shadow-sm border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-8 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <CalendarSection />
        </div>
      </div>
    );
  }

  if (activeSection === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white shadow-sm border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-8 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <LeaderboardSection />
        </div>
      </div>
    );
  }

  if (selectedTopic) {
    const topic = topics.find((t: Topic) => t.id === selectedTopic);
    const topicVideos = getTopicVideos(selectedTopic);
    
    if (selectedVideo) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            <div className="mb-4 lg:mb-6">
              <button
                onClick={() => setSelectedVideo(null)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <span>← ভিডিও তালিকায় ফিরে যান</span>
              </button>
            </div>
            
            <div className="pb-20 lg:pb-0">
              <VideoPlayer 
                video={selectedVideo} 
                onVideoComplete={handleVideoComplete}
              />
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="grid grid-cols-5 gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                      activeSection === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="mb-4 lg:mb-6">
            <button
              onClick={() => {
                setSelectedTopic(null);
                setActiveSection('courses');
              }}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>← সব টপিকে ফিরে যান</span>
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{topic?.name}</h1>
            <p className="text-gray-600">{topic?.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-20 lg:pb-0">
            {topicVideos.map((video: Video, index) => (
              <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                   onClick={() => handleVideoSelect(video)}>
                <div className="relative">
                  <img
                    src={getThumbnailUrl(video.videoId)}
                    alt={video.title}
                    className="w-full h-40 lg:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoSelect(video);
                      }}
                      className="bg-white text-gray-900 p-3 lg:p-4 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Play className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    পর্ব {index + 1}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">{video.title}</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mb-4">{video.description}</p>
                  
                  {video.files && video.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">সংযুক্ত ফাইল:</h4>
                      <div className="space-y-2">
                        {video.files.map((file, fileIndex) => (
                          <a
                            key={fileIndex}
                            href={file.url}
                            download={file.name}
                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm lg:text-base">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Download className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoSelect(video);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
                  >
                    <Play className="h-4 w-4" />
                    <span>ভিডিও দেখুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />
      
      {/* Desktop Navigation */}
      <div className="hidden lg:block bg-white shadow-sm border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Enhanced Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl text-white p-6 lg:p-8 mb-6 lg:mb-8 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white bg-opacity-10 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-24 lg:w-48 h-24 lg:h-48 bg-white bg-opacity-10 rounded-full translate-y-12 lg:translate-y-24 -translate-x-12 lg:-translate-x-24"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4">আপনার শেখার যাত্রা শুরু করুন</h1>
            <p className="text-blue-100 mb-4 lg:mb-6 text-sm lg:text-base">বিভিন্ন টপিকে বিশেষজ্ঞ হয়ে উঠুন আমাদের সাথে</p>
            
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {[
                { icon: BookOpen, title: 'মোট কোর্স', value: stats.totalTopics },
                { icon: Award, title: 'সম্পূর্ণ হয়েছে', value: '৮' },
                { icon: Clock, title: 'মোট সময়', value: `${Math.floor(getTotalDuration() / 60)} ঘন্টা` },
              ].map((stat, index) => (
                <div key={index} className="bg-white bg-opacity-20 rounded-xl p-3 lg:p-4">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-xs lg:text-sm">{stat.title}</p>
                      <p className="text-white text-sm lg:text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 lg:mb-8">
          <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">সব টপিক</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-20 lg:pb-0">
            {topics.map((topic: Topic) => {
              const videoCount = getTopicVideos(topic.id).length;
              const progress = getTopicProgress(topic.id);
              
              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-2"
                >
                  {topic.thumbnail && (
                    <img
                      src={topic.thumbnail}
                      alt={topic.name}
                      className="w-full h-32 lg:h-40 object-cover"
                    />
                  )}
                  <div className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                      <span className="text-xs lg:text-sm text-gray-500">{videoCount} টি ভিডিও</span>
                    </div>
                    
                    <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-2">{topic.name}</h3>
                    <p className="text-sm lg:text-base text-gray-600 mb-3 lg:mb-4">{topic.description}</p>
                    
                    <div className="mb-3 lg:mb-4">
                      <div className="flex justify-between text-xs lg:text-sm text-gray-600 mb-1">
                        <span>অগ্রগতি</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 lg:py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm lg:text-base font-medium">
                      শুরু করুন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                  activeSection === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;