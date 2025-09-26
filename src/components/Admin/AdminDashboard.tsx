import React, { useState } from 'react';
import { Users, Video, BookOpen, BarChart3, Settings, PlayCircle, MessageSquare, Calendar, HelpCircle, Trophy } from 'lucide-react';
import { useStats } from '../../hooks/useStats';
import TopicManager from './TopicManager';
import { VideoManager } from './VideoManager';
import CommunityManager from './CommunityManager';
import CalendarManager from './CalendarManager';
import QuizManager from './QuizManager';
import ProgressManager from './ProgressManager';
import AnalyticsSection from './AnalyticsSection';
import ChallengeManager from './ChallengeManager';
import Navbar from '../Layout/Navbar';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('topics');
  const { stats, loading } = useStats();

  const tabs = [
    { id: 'topics', label: 'টপিক ম্যানেজমেন্ট', icon: BookOpen },
    { id: 'videos', label: 'ভিডিও ম্যানেজমেন্ট', icon: Video },
    { id: 'quizzes', label: 'কুইজ ম্যানেজমেন্ট', icon: HelpCircle },
    { id: 'community', label: 'কমিউনিটি', icon: MessageSquare },
    { id: 'challenges', label: 'চ্যালেঞ্জ', icon: Trophy },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
    { id: 'progress', label: 'শিক্ষার্থীর অগ্রগতি', icon: Users },
    { id: 'classroom', label: 'ক্লাসরুম', icon: PlayCircle },
    { id: 'analytics', label: 'রিপোর্ট', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">এডমিন ড্যাশবোর্ড</h1>
          <p className="text-gray-600">কোর্স এবং শিক্ষার্থীদের ব্যবস্থাপনা করুন</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
          {[
            { title: 'মোট শিক্ষার্থী', value: loading ? '...' : stats.totalUsers, icon: Users, color: 'blue' },
            { title: 'মোট ভিডিও', value: loading ? '...' : stats.totalVideos, icon: Video, color: 'green' },
            { title: 'মোট টপিক', value: loading ? '...' : stats.totalTopics, icon: BookOpen, color: 'purple' },
            { title: 'মোট ইভেন্ট', value: loading ? '...' : stats.totalEvents, icon: BarChart3, color: 'orange' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 animate-pulse">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 animate-bounce`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'topics' && <TopicManager />}
          {activeTab === 'videos' && <VideoManager />}
          {activeTab === 'quizzes' && <QuizManager />}
          {activeTab === 'community' && <CommunityManager />}
          {activeTab === 'challenges' && <ChallengeManager />}
          {activeTab === 'calendar' && <CalendarManager />}
          {activeTab === 'progress' && <ProgressManager />}
          {activeTab === 'classroom' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ক্লাসরুম ম্যানেজমেন্ট</h2>
              <p className="text-gray-600">শীঘ্রই আসছে...</p>
            </div>
          )}
          {activeTab === 'analytics' && (
            <AnalyticsSection />
          )}
        </div>
      </div>
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
`;
document.head.appendChild(style);

export default AdminDashboard;