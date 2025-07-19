import React, { useState } from 'react';
import { Play, BookOpen, Award, Clock, MessageSquare, Calendar, Trophy, Download, File } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useStats } from '../../hooks/useStats';
import { Topic, Video, UserProgress } from '../../types';
import { getThumbnailUrl } from '../../utils/youtube';
import { formatFileSize, getFileIcon } from '../../utils/fileUpload';
import VideoPlayer from './VideoPlayer';
import CommunitySection from './CommunitySection';
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
  const { currentUser } = useAuth();

  const handleVideoSelect = async (video: Video) => {
    if (!currentUser) return;
    
    // Check if user can access this video
    const userVideoProgress = userProgress.find((progress: UserProgress) => 
      progress.userId === currentUser.uid && progress.videoId === video.id
    );
    
    // If no progress exists, create initial progress
    if (!userVideoProgress) {
      const topicVideos = getTopicVideos(video.topicId).sort((a, b) => a.order - b.order);
      const videoIndex = topicVideos.findIndex(v => v.id === video.id);
      
      // Check if previous videos are completed
      let canAccess = videoIndex === 0; // First video is always accessible
      
      if (videoIndex > 0) {
        const previousVideo = topicVideos[videoIndex - 1];
        const previousProgress = userProgress.find((progress: UserProgress) => 
          progress.userId === currentUser.uid && progress.videoId === previousVideo.id
        );
        canAccess = previousProgress?.watched || false;
      }
      
      try {
        await addProgress({
          userId: currentUser.uid,
          videoId: video.id,
          watched: false,
          canAccess,
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
  // If a specific section is selected, render that section
  if (activeSection === 'community') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <CommunitySection />
      </div>
    );
  }

  if (activeSection === 'challenges') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <ChallengeSection />
      </div>
    );
  }

  if (activeSection === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <CalendarSection />
      </div>
    );
  }

  if (activeSection === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LeaderboardSection />
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
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← ভিডিও তালিকায় ফিরে যান
              </button>
            </div>
            
            <VideoPlayer 
              video={selectedVideo} 
              onVideoComplete={handleVideoComplete}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedTopic(null);
                setActiveSection('courses');
              }}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← সব টপিকে ফিরে যান
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{topic?.name}</h1>
            <p className="text-gray-600">{topic?.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topicVideos.map((video: Video, index) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => handleVideoSelect(video)}>
                <div className="relative">
                  <img
                    src={getThumbnailUrl(video.videoId)}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoSelect(video);
                      }}
                      className="bg-white text-gray-900 p-4 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Play className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    পর্ব {index + 1}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{video.description}</p>
                  
                  {video.files && video.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">সংযুক্ত ফাইল:</h4>
                      <div className="space-y-2">
                        {video.files.map((file, fileIndex) => (
                          <a
                            key={fileIndex}
                            href={file.url}
                            download={file.name}
                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-lg">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Download className="h-4 w-4 text-gray-400" />
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
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>ভিডিও দেখুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white shadow-sm border-b sticky top-16 z-40">
        <div className="flex overflow-x-auto px-4 py-2 space-x-2">
          {[
            { id: 'courses', label: 'কোর্স', icon: BookOpen },
            { id: 'community', label: 'কমিউনিটি', icon: MessageSquare },
            { id: 'challenges', label: 'চ্যালেঞ্জ', icon: Trophy },
            { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
            { id: 'leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-6 lg:p-8 mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">আপনার শেখার যাত্রা শুরু করুন</h1>
          <p className="text-blue-100 mb-6">বিভিন্ন টপিকে বিশেষজ্ঞ হয়ে উঠুন আমাদের সাথে</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: 'মোট কোর্স', value: stats.totalTopics },
              { icon: Award, title: 'সম্পূর্ণ হয়েছে', value: '৮' },
              { icon: Clock, title: 'মোট সময়', value: `${Math.floor(getTotalDuration() / 60)} ঘন্টা` },
            ].map((stat, index) => (
              <div key={index} className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <stat.icon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-200" />
                  <div>
                    <p className="text-blue-100 text-sm">{stat.title}</p>
                    <p className="text-white text-lg lg:text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block mb-8">
          <div className="flex justify-center space-x-4 mb-6">
            {[
              { id: 'courses', label: 'কোর্স', icon: BookOpen },
              { id: 'community', label: 'কমিউনিটি', icon: MessageSquare },
              { id: 'challenges', label: 'চ্যালেঞ্জ', icon: Trophy },
              { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
              { id: 'leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">সব টপিক</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {topics.map((topic: Topic) => {
              const videoCount = getTopicVideos(topic.id).length;
              const progress = getTopicProgress(topic.id);
              
              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
                >
                  {topic.thumbnail && (
                    <img
                      src={topic.thumbnail}
                      alt={topic.name}
                      className="w-full h-32 lg:h-40 object-cover"
                    />
                  )}
                  <div className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                      <span className="text-sm text-gray-500">{videoCount} টি ভিডিও</span>
                    </div>
                    
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">{topic.name}</h3>
                    <p className="text-gray-600 mb-4">{topic.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>অগ্রগতি</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      শুরু করুন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;