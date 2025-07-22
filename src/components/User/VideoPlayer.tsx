import React, { useState, useEffect } from 'react';
import { CheckCircle, Award, Play, Lock, FileText, ExternalLink } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { Video, Quiz, UserProgress, UserProfile, Topic } from '../../types';
import YouTubePlayer from '../Common/YouTubePlayer';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  video: Video;
  onVideoComplete: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onVideoComplete }) => {
  const { currentUser } = useAuth();
  const { documents: quizzes } = useFirestore('quizzes');
  const { documents: userProgress, addDocument: addProgress, updateDocument: updateProgress } = useFirestore('userProgress');
  const { documents: userProfiles, updateDocument: updateUserProfile } = useFirestore('userProfiles');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [completionForm, setCompletionForm] = useState({
    summary: '',
    workLink: ''
  });

  const currentUserProfile = userProfiles.find((profile: UserProfile) => profile.userId === currentUser?.uid);
  const videoQuiz = quizzes.find((quiz: Quiz) => quiz.videoId === video.id);
  const userVideoProgress = userProgress.find((progress: UserProgress) => 
    progress.userId === currentUser?.uid && progress.videoId === video.id
  );

  const isVideoCompleted = userVideoProgress?.watched || false;

  const handleCompleteVideo = () => {
    setShowCompleteModal(true);
  };

  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      const progressData = {
        userId: currentUser.uid,
        videoId: video.id,
        watched: false, // Will be set to true after quiz (if exists) or immediately
        canAccess: true, // All videos are now accessible
        summary: completionForm.summary,
        workLink: completionForm.workLink,
        quizScore: null,
        quizPassed: false,
        quizAttempts: 0,
        submittedAt: new Date()
      };

      if (userVideoProgress) {
        await updateProgress(userVideoProgress.id, progressData);
      } else {
        await addProgress(progressData);
      }

      setShowCompleteModal(false);
      
      if (videoQuiz) {
        setQuizAnswers(new Array(videoQuiz.questions.length).fill(-1));
        setShowQuizModal(true);
      } else {
        // No quiz, mark as completed immediately
        const updatedProgressData = {
          ...progressData,
          watched: true,
          completedAt: new Date()
        };
        
        if (userVideoProgress) {
          await updateProgress(userVideoProgress.id, updatedProgressData);
        } else {
          const newProgressId = await addProgress(updatedProgressData);
        }
        
        // Award points for video completion
        if (currentUserProfile) {
          await updateUserProfile(currentUserProfile.id, {
            points: currentUserProfile.points + 5, // 5 points for completing video
            completedVideos: currentUserProfile.completedVideos + 1
          });
          
          // Update access for next videos in the topic
          const topicVideos = videos
            .filter((v: Video) => v.topicId === video.topicId)
            .sort((a: Video, b: Video) => a.order - b.order);
          
          const currentVideoIndex = topicVideos.findIndex((v: Video) => v.id === video.id);
          
        }
        
        onVideoComplete();
      }
      
      toast.success('ভিডিও সম্পূর্ণ করার তথ্য জমা দেওয়া হয়েছে!');
    } catch (error) {
      console.error('Error submitting completion:', error);
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleQuizSubmit = async () => {
    if (!videoQuiz || !currentUser) return;

    // Calculate score
    let correctAnswers = 0;
    videoQuiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / videoQuiz.questions.length) * 100);
    const passed = score >= videoQuiz.passingScore;
    
    setQuizScore(score);

    try {
      // Update progress with quiz results
      const progressData = {
        ...userVideoProgress,
        watched: passed, // Only mark as watched if quiz is passed
        quizScore: score,
        quizPassed: passed,
        quizAttempts: (userVideoProgress?.quizAttempts || 0) + 1
      };

      if (userVideoProgress) {
        await updateProgress(userVideoProgress.id, progressData);
      }

      // Award points if passed
      if (passed && currentUserProfile) {
        await updateUserProfile(currentUserProfile.id, {
          points: currentUserProfile.points + videoQuiz.points,
          completedVideos: currentUserProfile.completedVideos + 1
        });
        toast.success(`অভিনন্দন! আপনি ${videoQuiz.points} পয়েন্ট পেয়েছেন!`);
      }

      if (passed) {
        onVideoComplete();
      } else {
        toast.error(`দুঃখিত! আপনার স্কোর ${score}%। পাসিং স্কোর ${videoQuiz.passingScore}%`);
      }
    } catch (error) {
      toast.error('কুইজের ফলাফল সেভ করতে সমস্যা হয়েছে!');
    }
  };

  const markVideoAsCompleted = async () => {
    if (!currentUser || !userVideoProgress) return;

    try {
      await updateProgress(userVideoProgress.id, {
        ...userVideoProgress,
        watched: true,
        completedAt: new Date()
      });

      // Award points for video completion
      if (currentUserProfile) {
        await updateUserProfile(currentUserProfile.id, {
          points: currentUserProfile.points + 5, // 5 points for completing video
          completedVideos: currentUserProfile.completedVideos + 1
        });
      }

      onVideoComplete();
    } catch (error) {
      toast.error('ভিডিও সম্পূর্ণ করতে সমস্যা হয়েছে!');
    }
  };

  const retryQuiz = () => {
    setQuizAnswers(new Array(videoQuiz!.questions.length).fill(-1));
    setQuizScore(null);
  };

  

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Video Thumbnail */}
      <div className="relative">
        <img
          src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
          alt={video.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <button
            onClick={() => setIsPlayerOpen(true)}
            className="bg-white text-gray-900 p-4 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Play className="h-8 w-8" />
          </button>
        </div>
        {isVideoCompleted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white p-2 rounded-full">
            <CheckCircle className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h2>
        <p className="text-gray-600 mb-4">{video.description}</p>

        {/* Files */}
        {video.files && video.files.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">সংযুক্ত ফাইল:</h3>
            <div className="space-y-2">
              {video.files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  download={file.name}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="flex-1 text-gray-900">{file.name}</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setIsPlayerOpen(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="h-5 w-5" />
            <span>ভিডিও দেখুন</span>
          </button>
          
          {!isVideoCompleted && (
            <button
              onClick={handleCompleteVideo}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>সম্পূর্ণ করুন</span>
            </button>
          )}
        </div>

        {/* Quiz Info */}
        {videoQuiz && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">কুইজ উপলব্ধ</span>
            </div>
            <p className="text-yellow-700 text-sm">
              এই ভিডিও সম্পূর্ণ করার পর {videoQuiz.questions.length}টি প্রশ্নের কুইজ দিতে হবে। 
              পাসিং স্কোর: {videoQuiz.passingScore}%
            </p>
          </div>
        )}
      </div>

      {/* YouTube Player */}
      <YouTubePlayer
        videoId={video.videoId}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        title={video.title}
      />

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">ভিডিও সম্পূর্ণ করুন</h3>
            
            <form onSubmit={handleSubmitCompletion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  এই ভিডিও থেকে আপনি কী শিখেছেন? (সারসংক্ষেপ) *
                </label>
                <textarea
                  required
                  value={completionForm.summary}
                  onChange={(e) => setCompletionForm({ ...completionForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="আপনার শেখা বিষয়গুলো লিখুন..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  প্রজেক্ট লিংক (যদি থাকে)
                </label>
                <input
                  type="url"
                  value={completionForm.workLink}
                  onChange={(e) => setCompletionForm({ ...completionForm, workLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  জমা দিন
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && videoQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">কুইজ - {video.title}</h3>
            
            {quizScore === null ? (
              <div className="space-y-6">
                {videoQuiz.questions.map((question, questionIndex) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      প্রশ্ন {questionIndex + 1}: {question.question}
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            value={optionIndex}
                            checked={quizAnswers[questionIndex] === optionIndex}
                            onChange={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[questionIndex] = optionIndex;
                              setQuizAnswers(newAnswers);
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleQuizSubmit}
                  disabled={quizAnswers.includes(-1)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  কুইজ জমা দিন
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className={`text-6xl mb-4 ${quizScore >= videoQuiz.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                  {quizScore >= videoQuiz.passingScore ? '🎉' : '😞'}
                </div>
                <h4 className="text-2xl font-bold mb-2">
                  আপনার স্কোর: {quizScore}%
                </h4>
                <p className={`text-lg mb-6 ${quizScore >= videoQuiz.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                  {quizScore >= videoQuiz.passingScore 
                    ? `অভিনন্দন! আপনি ${videoQuiz.points} পয়েন্ট পেয়েছেন!`
                    : `দুঃখিত! পাসিং স্কোর ${videoQuiz.passingScore}%`
                  }
                </p>
                
                <div className="flex space-x-4">
                  {quizScore >= videoQuiz.passingScore ? (
                    <button
                      onClick={() => setShowQuizModal(false)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      পরবর্তী ভিডিওতে যান
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={retryQuiz}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        আবার চেষ্টা করুন
                      </button>
                      <button
                        onClick={() => setShowQuizModal(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        বন্ধ করুন
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;