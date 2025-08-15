import React from 'react';
import { Users, Video, BookOpen, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useStats } from '../../hooks/useStats';
import { UserProfile } from '../../types';

// Simple chart components without external dependencies
const SimpleBarChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={index} className="flex items-center space-x-3">
        <span className="w-16 text-sm text-gray-600">{item.name}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
              backgroundColor: item.color || '#3B82F6'
            }}
          />
        </div>
        <span className="w-12 text-sm font-medium text-gray-900">{item.value}</span>
      </div>
    ))}
  </div>
);

const SimpleLineChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="space-y-3">
    {data.slice(0, 8).map((item, index) => (
      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-blue-600">{item.points} পয়েন্ট</span>
          <span className="text-xs text-gray-500">{item.videos} ভিডিও</span>
        </div>
      </div>
    ))}
  </div>
);

const SimplePieChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-4">
    {data.map((item, index) => (
      <div key={index} className="text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: item.color }}
        >
          {item.value}
        </div>
        <p className="text-sm text-gray-600">{item.name}</p>
      </div>
    ))}
  </div>
);

const AnalyticsSection: React.FC = () => {
  const { stats, loading } = useStats();
  const { documents: userProfiles } = useSupabase('user_profiles', 'points', false);

  const topUsers = userProfiles
    .sort((a: UserProfile, b: UserProfile) => b.points - a.points)
    .slice(0, 10);

  const chartData = [
    { name: 'শিক্ষার্থী', value: stats.totalUsers, color: '#3B82F6' },
    { name: 'ভিডিও', value: stats.totalVideos, color: '#10B981' },
    { name: 'টপিক', value: stats.totalTopics, color: '#8B5CF6' },
    { name: 'পোস্ট', value: stats.totalPosts, color: '#F59E0B' },
  ];

  const progressData = topUsers.map((user: UserProfile, index) => ({
    name: user.displayName || `ব্যবহারকারী ${index + 1}`,
    points: user.points,
    videos: user.completedVideos
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'মোট শিক্ষার্থী', value: stats.totalUsers, icon: Users, color: 'blue', change: '+12%' },
          { title: 'মোট ভিডিও', value: stats.totalVideos, icon: Video, color: 'green', change: '+8%' },
          { title: 'মোট টপিক', value: stats.totalTopics, icon: BookOpen, color: 'purple', change: '+5%' },
          { title: 'মোট পোস্ট', value: stats.totalPosts, icon: MessageSquare, color: 'orange', change: '+15%' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">সিস্টেম ওভারভিউ</h3>
          <div className="h-64">
            <SimpleBarChart data={chartData} />
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">শীর্ষ শিক্ষার্থী</h3>
          <div className="space-y-3">
            {topUsers.slice(0, 5).map((user: UserProfile, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index < 3 ? <Award className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.displayName || 'ব্যবহারকারী'}</p>
                    <p className="text-sm text-gray-600">{user.completedVideos} ভিডিও সম্পূর্ণ</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{user.points}</p>
                  <p className="text-xs text-gray-500">পয়েন্ট</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Progress Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">শিক্ষার্থীদের অগ্রগতি</h3>
          <div className="h-64 overflow-y-auto">
            <SimpleLineChart data={progressData} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">কন্টেন্ট বিতরণ</h3>
          <div className="h-64 flex items-center justify-center">
            <SimplePieChart data={chartData} />
          </div>
        </div>
      </div>

      {/* Detailed User Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">বিস্তারিত র‍্যাঙ্কিং</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  র‍্যাঙ্ক
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  নাম
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  পয়েন্ট
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  সম্পূর্ণ ভিডিও
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  যোগদানের তারিখ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topUsers.map((user: UserProfile, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 ? (
                        <Award className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-500'
                        }`} />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || 'ব্যবহারকারী'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.points} পয়েন্ট
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.completedVideos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.joinedAt).toLocaleDateString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;