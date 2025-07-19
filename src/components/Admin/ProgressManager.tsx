import React, { useState } from 'react';
import { Eye, CheckCircle, Clock, Award, User, FileText, ExternalLink } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { UserProgress, Video, Topic, UserProfile } from '../../types';

const ProgressManager: React.FC = () => {
  const { documents: userProgress } = useFirestore('userProgress', 'submittedAt');
  const { documents: videos } = useFirestore('videos', 'order');
  const { documents: topics } = useFirestore('topics', 'order');
  const { documents: userProfiles } = useFirestore('userProfiles');
  const [selectedProgress, setSelectedProgress] = useState<UserProgress | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const getVideoTitle = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    return video ? video.title : 'অজানা ভিডিও';
  };

  const getTopicName = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    if (!video) return 'অজানা টপিক';
    const topic = topics.find((t: Topic) => t.id === video.topicId);
    return topic ? topic.name : 'অজানা টপিক';
  };

  const getUserProfile = (userId: string) => {
    return userProfiles.find((profile: UserProfile) => profile.userId === userId);
  };

  const filteredProgress = userProgress.filter((progress: UserProgress) => {
    if (filterStatus === 'pending') return !progress.watched;
    if (filterStatus === 'completed') return progress.watched;
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">শিক্ষার্থীর অগ্রগতি</h2>
          <p className="text-gray-600">শিক্ষার্থীদের ভিডিও সম্পূর্ণকরণ এবং প্রজেক্ট জমা দেখুন</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            সব ({userProgress.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            অপেক্ষমাণ ({userProgress.filter(p => !p.watched).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            সম্পূর্ণ ({userProgress.filter(p => p.watched).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress List */}
        <div className="space-y-4">
          {filteredProgress.map((progress: UserProgress) => {
            const userProfile = getUserProfile(progress.userId);
            
            return (
              <div
                key={progress.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedProgress?.id === progress.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedProgress(progress)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {userProfile?.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt={userProfile.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {userProfile?.displayName || 'ব্যবহারকারী'}
                      </h3>
                      <p className="text-sm text-gray-600">{getVideoTitle(progress.videoId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {progress.watched ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600" />
                    )}
                    {progress.quizScore !== undefined && (
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">
                          {progress.quizScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-1">টপিক: {getTopicName(progress.videoId)}</p>
                  {progress.submittedAt && (
                    <p>জমা দেওয়া: {formatDate(progress.submittedAt)}</p>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredProgress.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">কোন অগ্রগতি নেই</p>
            </div>
          )}
        </div>

        {/* Progress Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          {selectedProgress ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">অগ্রগতির বিস্তারিত</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedProgress.watched
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {selectedProgress.watched ? 'সম্পূর্ণ' : 'অপেক্ষমাণ'}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    শিক্ষার্থী
                  </label>
                  <div className="flex items-center space-x-3">
                    {getUserProfile(selectedProgress.userId)?.avatar ? (
                      <img
                        src={getUserProfile(selectedProgress.userId)?.avatar}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-gray-900">
                      {getUserProfile(selectedProgress.userId)?.displayName || 'ব্যবহারকারী'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ভিডিও
                  </label>
                  <p className="text-gray-900">{getVideoTitle(selectedProgress.videoId)}</p>
                  <p className="text-sm text-gray-600">{getTopicName(selectedProgress.videoId)}</p>
                </div>
                
                {selectedProgress.summary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      সারসংক্ষেপ
                    </label>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-900">{selectedProgress.summary}</p>
                    </div>
                  </div>
                )}
                
                {selectedProgress.workLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      প্রজেক্ট লিংক
                    </label>
                    <a
                      href={selectedProgress.workLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>প্রজেক্ট দেখুন</span>
                    </a>
                  </div>
                )}
                
                {selectedProgress.quizScore !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      কুইজের ফলাফল
                    </label>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">স্কোর: {selectedProgress.quizScore}%</span>
                        <div className="flex items-center space-x-2">
                          {selectedProgress.quizPassed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            selectedProgress.quizPassed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedProgress.quizPassed ? 'পাস' : 'ফেইল'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        চেষ্টা: {selectedProgress.quizAttempts} বার
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedProgress.submittedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      জমা দেওয়ার সময়
                    </label>
                    <p className="text-gray-900">{formatDate(selectedProgress.submittedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">বিস্তারিত দেখতে একটি অগ্রগতি নির্বাচন করুন</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressManager;