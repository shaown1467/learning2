import React, { useState } from 'react';
import { Trophy, Calendar, Users, Heart, MessageSquare, Play, Upload, File, Download, CreditCard, Clock, Star } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../contexts/AuthContext';
import { Challenge, ChallengeSubmission, ChallengeComment, ChallengePayment, UserProfile } from '../../types';
import { extractVideoId, getThumbnailUrl } from '../../utils/youtube';
import { uploadFile, formatFileSize, getFileIcon } from '../../utils/fileUpload';
import YouTubePlayer from '../Common/YouTubePlayer';
import toast from 'react-hot-toast';

const ChallengeSection: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents: challenges } = useSupabase('challenges', 'created_at', false);
  const { documents: submissions, addDocument: addSubmission, updateDocument: updateSubmission } = useSupabase('challenge_submissions', 'likes_count', false);
  const { documents: comments, addDocument: addComment } = useSupabase('challenge_comments', 'created_at', false);
  const { documents: payments, addDocument: addPayment } = useSupabase('challenge_payments', 'created_at', false);
  const { documents: userProfiles } = useSupabase('user_profiles');
  
  const [activeTab, setActiveTab] = useState<'7day' | '30day'>('7day');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [playerState, setPlayerState] = useState({ isOpen: false, videoId: '', title: '' });
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    imageUrl: '',
    files: [] as any[]
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentNumber: '',
    transactionId: ''
  });

  const currentUserProfile = userProfiles.find((profile: UserProfile) => profile.userId === currentUser?.uid);
  
  const activeChallenge7Day = challenges.find((c: Challenge) => c.type === '7day' && c.is_active);
  const activeChallenge30Day = challenges.find((c: Challenge) => c.type === '30day' && c.is_active);
  
  const currentChallenge = activeTab === '7day' ? activeChallenge7Day : activeChallenge30Day;
  
  const challengeSubmissions = submissions
    .filter((s: ChallengeSubmission) => 
      s.challenge_type === activeTab && 
      s.approved &&
      (currentChallenge ? s.challenge_id === currentChallenge.id : false)
    )
    .sort((a: ChallengeSubmission, b: ChallengeSubmission) => b.likes_count - a.likes_count);

  const userPayment = currentChallenge ? payments.find((p: ChallengePayment) => 
    p.challenge_id === currentChallenge.id && 
    p.user_id === currentUser?.uid &&
    p.status === 'approved'
  ) : null;

  const canParticipate = (challenge: Challenge) => {
    if (!challenge) return false;
    if (challenge.type === '7day') return true;
    if (challenge.type === '30day') {
      return challenge.price === 0 || userPayment;
    }
    return false;
  };

  const resetSubmissionForm = () => {
    setSubmissionForm({
      title: '',
      description: '',
      youtubeUrl: '',
      imageUrl: '',
      files: []
    });
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !currentChallenge) return;

    const videoId = extractVideoId(submissionForm.youtubeUrl);
    if (!videoId) {
      toast.error('সঠিক ইউটিউব লিংক দিন!');
      return;
    }

    try {
      await addSubmission({
        challenge_id: currentChallenge.id,
        challenge_type: activeTab,
        user_id: currentUser.uid,
        author_name: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        author_avatar: currentUserProfile?.avatar,
        title: submissionForm.title,
        description: submissionForm.description,
        youtube_url: submissionForm.youtubeUrl,
        video_id: videoId,
        image_url: submissionForm.imageUrl,
        files: submissionForm.files,
        approved: false,
        likes: [],
        likes_count: 0,
        comments_count: 0
      });
      
      toast.success('প্রজেক্ট জমা দেওয়া হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।');
      setIsSubmissionModalOpen(false);
      resetSubmissionForm();
    } catch (error) {
      toast.error('প্রজেক্ট জমা দিতে সমস্যা হয়েছে!');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !currentChallenge) return;

    try {
      await addPayment({
        challenge_id: currentChallenge.id,
        user_id: currentUser.uid,
        user_name: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        user_email: currentUser.email || '',
        payment_number: paymentForm.paymentNumber,
        transaction_id: paymentForm.transactionId,
        amount: currentChallenge.price,
        status: 'pending'
      });
      
      toast.success('পেমেন্ট তথ্য জমা দেওয়া হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।');
      setIsPaymentModalOpen(false);
      setPaymentForm({ paymentNumber: '', transactionId: '' });
    } catch (error) {
      toast.error('পেমেন্ট তথ্য জমা দিতে সমস্যা হয়েছে!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadFile(file, 'challenge-files');
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          url,
          size: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setSubmissionForm({
        ...submissionForm,
        files: [...submissionForm.files, ...uploadedFiles]
      });
      toast.success('ফাইল আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setSubmissionForm({
      ...submissionForm,
      files: submissionForm.files.filter(f => f.id !== fileId)
    });
  };

  const toggleLike = async (submissionId: string) => {
    if (!currentUser) return;

    const submission = submissions.find((s: ChallengeSubmission) => s.id === submissionId);
    if (!submission) return;

    try {
      const hasLiked = submission.likes.includes(currentUser.uid);
      let newLikes;
      
      if (hasLiked) {
        newLikes = submission.likes.filter((uid: string) => uid !== currentUser.uid);
      } else {
        newLikes = [...submission.likes, currentUser.uid];
      }

      await updateSubmission(submissionId, {
        likes: newLikes,
        likes_count: newLikes.length
      });
    } catch (error) {
      toast.error('লাইক করতে সমস্যা হয়েছে!');
    }
  };

  const handleAddComment = async (submissionId: string) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      await addComment({
        submission_id: submissionId,
        author_id: currentUser.uid,
        author_name: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        author_avatar: currentUserProfile?.avatar,
        content: commentText
      });

      // Update submission comment count
      const submission = submissions.find((s: ChallengeSubmission) => s.id === submissionId);
      if (submission) {
        await updateSubmission(submissionId, {
          comments_count: submission.comments_count + 1
        });
      }
      
      setCommentText('');
      toast.success('মন্তব্য যোগ করা হয়েছে!');
    } catch (error) {
      toast.error('মন্তব্য করতে সমস্যা হয়েছে!');
    }
  };

  const isSubmissionLiked = (submission: ChallengeSubmission) => {
    return currentUser ? submission.likes.includes(currentUser.uid) : false;
  };

  const getSubmissionComments = (submissionId: string) => {
    return comments.filter((comment: ChallengeComment) => comment.submission_id === submissionId);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'এখনই';
    if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} দিন আগে`;
    
    return date.toLocaleDateString('bn-BD');
  };

  const openPlayer = (videoId: string, title: string) => {
    setPlayerState({ isOpen: true, videoId, title });
  };

  const closePlayer = () => {
    setPlayerState({ isOpen: false, videoId: '', title: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl text-white p-8 mb-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white bg-opacity-10 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-24 lg:w-48 h-24 lg:h-48 bg-white bg-opacity-10 rounded-full translate-y-12 lg:translate-y-24 -translate-x-12 lg:-translate-x-24"></div>
          
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-300 animate-bounce" />
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
              চ্যালেঞ্জ সেকশন
            </h1>
            <p className="text-purple-100 text-sm lg:text-lg mb-6">আপনার দক্ষতা প্রমাণ করুন এবং পুরস্কার জিতুন!</p>
            <div className="flex flex-col lg:flex-row justify-center space-y-2 lg:space-y-0 lg:space-x-6 text-purple-100">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm lg:text-base">৭ দিনের চ্যালেঞ্জ - ফ্রি</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span className="text-sm lg:text-base">৩০ দিনের চ্যালেঞ্জ - প্রিমিয়াম</span>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2 w-full max-w-md lg:max-w-none">
            <button
              onClick={() => setActiveTab('7day')}
              className={`px-4 lg:px-8 py-3 lg:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-sm lg:text-base ${
                activeTab === '7day'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>৭ দিনের চ্যালেঞ্জ</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('30day')}
              className={`px-4 lg:px-8 py-3 lg:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-sm lg:text-base ${
                activeTab === '30day'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>৩০ দিনের চ্যালেঞ্জ</span>
              </div>
            </button>
          </div>
        </div>

        {/* Challenge Info & Actions */}
        {currentChallenge && (
          <div className="bg-white rounded-3xl shadow-xl p-4 lg:p-8 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-6 space-y-4 lg:space-y-0">
              <div className="flex-1">
                <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mb-3">{currentChallenge.title}</h2>
                <p className="text-gray-600 text-sm lg:text-lg mb-4">{currentChallenge.description}</p>
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>শুরু: {new Date(currentChallenge.start_date).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>শেষ: {new Date(currentChallenge.end_date).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{challengeSubmissions.length} জন অংশগ্রহণকারী</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4 w-full lg:w-auto">
                {currentChallenge.type === '30day' && currentChallenge.price > 0 && !userPayment && (
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 lg:p-6 mb-4">
                      <CreditCard className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-orange-800 font-semibold">প্রিমিয়াম চ্যালেঞ্জ</p>
                      <p className="text-xl lg:text-2xl font-bold text-orange-900">৳{currentChallenge.price}</p>
                    </div>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full lg:w-auto bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 lg:px-8 py-3 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-sm lg:text-base"
                    >
                      পেমেন্ট করুন
                    </button>
                  </div>
                )}
                
                {canParticipate(currentChallenge) && (
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                    className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 lg:px-8 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center space-x-2 text-sm lg:text-base"
                  >
                    <Upload className="h-5 w-5" />
                    <span>প্রজেক্ট জমা দিন</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submissions */}
        <div className="space-y-8">
          {challengeSubmissions.map((submission: ChallengeSubmission, index) => {
            const submissionComments = getSubmissionComments(submission.id);
            
            return (
              <div key={submission.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1 max-w-2xl mx-auto">
                {/* Rank Badge */}
                {index < 3 && (
                  <div className={`absolute top-2 lg:top-3 left-2 lg:left-3 z-10 px-2 lg:px-3 py-1 rounded-full text-white font-bold shadow-md text-xs lg:text-sm ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    #{index + 1}
                  </div>
                )}

                {/* Submission Header */}
                <div className="p-3 lg:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {submission.author_avatar ? (
                          <img
                            src={submission.author_avatar}
                            alt={submission.author_name}
                            className="w-10 lg:w-12 h-10 lg:h-12 rounded-full object-cover ring-2 ring-purple-100 shadow-md"
                          />
                        ) : (
                          <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center ring-2 ring-purple-100 shadow-md">
                            <span className="text-white font-bold text-sm lg:text-lg">
                              {submission.author_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-3 lg:w-4 h-3 lg:h-4 bg-green-400 rounded-full border-2 border-white shadow-md"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm lg:text-lg">{submission.author_name}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-500 font-medium">{formatTimeAgo(submission.createdAt)}</span>
                          <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            submission.challenge_type === '7day' ? 'bg-purple-500' : 'bg-orange-500'
                          }`}>
                            {submission.challenge_type === '7day' ? '৭ দিনের চ্যালেঞ্জ' : '৩০ দিনের চ্যালেঞ্জ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Content */}
                <div className="p-3 lg:p-4">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 leading-tight">{submission.title}</h2>
                  <p className="text-gray-700 mb-4 leading-relaxed text-sm lg:text-base">{submission.description}</p>
                  
                  {/* Video Thumbnail */}
                  <div className="mb-4">
                    <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                      <img
                        src={getThumbnailUrl(submission.video_id, 'maxres')}
                        alt={submission.title}
                        className="w-full h-32 lg:h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPlayer(submission.video_id, submission.title)}
                          className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110"
                        >
                          <Play className="h-4 lg:h-6 w-4 lg:w-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {submission.image_url && (
                    <div className="mb-4">
                      <img
                        src={submission.image_url}
                        alt="Project"
                        className="w-full h-32 lg:h-48 object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                      />
                    </div>
                  )}
                  
                  {submission.files && submission.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center text-xs lg:text-sm">
                        <File className="h-4 w-4 mr-2 text-purple-600" />
                        সংযুক্ত ফাইল ({submission.files.length}টি)
                      </h4>
                      <div className="grid grid-cols-1 gap-2 lg:gap-3">
                        {submission.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            download={file.name}
                            className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:shadow-md group"
                          >
                            <span className="text-lg lg:text-2xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs lg:text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Download className="h-3 lg:h-4 w-3 lg:w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission Actions */}
                <div className="px-3 lg:px-4 py-3 bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-6">
                      <button 
                        onClick={() => toggleLike(submission.id)}
                        className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 text-xs lg:text-sm ${
                          isSubmissionLiked(submission) 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-md' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 hover:shadow-md'
                        }`}
                      >
                        <Heart className={`h-4 lg:h-5 w-4 lg:w-5 ${isSubmissionLiked(submission) ? 'fill-current' : ''}`} />
                        <span className="font-bold">{submission.likes_count}</span>
                        <span className="font-semibold hidden lg:inline">লাইক</span>
                      </button>
                      <button
                        onClick={() => setShowComments(showComments === submission.id ? null : submission.id)}
                        className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md text-xs lg:text-sm"
                      >
                        <MessageSquare className="h-4 lg:h-5 w-4 lg:w-5" />
                        <span className="font-bold">{submission.comments_count}</span>
                        <span className="font-semibold hidden lg:inline">মন্তব্য</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 font-medium hidden lg:block">
                      {submission.likes_count > 0 && (
                        <span className="bg-gray-100 px-3 py-1 rounded-full">
                          {submission.likes_count} জন লাইক করেছেন
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments === submission.id && (
                  <div className="border-t border-gray-100 bg-white">
                    <div className="p-3 lg:p-4">
                      <div className="space-y-4 mb-6">
                        {submissionComments.map((comment: ChallengeComment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              {comment.author_avatar ? (
                                <img
                                  src={comment.author_avatar}
                                  alt={comment.author_name}
                                  className="w-8 lg:w-10 h-8 lg:h-10 rounded-full object-cover ring-2 ring-gray-200"
                                />
                              ) : (
                                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs lg:text-sm font-semibold">
                                    {comment.author_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gradient-to-r from-gray-100 to-purple-50 rounded-xl px-3 lg:px-4 py-2 lg:py-3 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center space-x-2 mb-2">
                                  <p className="font-bold text-xs lg:text-sm text-gray-900">{comment.author_name}</p>
                                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-xs lg:text-sm">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {submissionComments.length === 0 && (
                          <div className="text-center py-8">
                            <MessageSquare className="h-8 lg:h-12 w-8 lg:w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">এখনো কোন মন্তব্য নেই। প্রথম মন্তব্য করুন!</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Input */}
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {currentUserProfile?.avatar ? (
                            <img
                              src={currentUserProfile.avatar}
                              alt="Your avatar"
                              className="w-8 lg:w-10 h-8 lg:h-10 rounded-full object-cover ring-2 ring-purple-200"
                            />
                          ) : (
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs lg:text-sm font-semibold">
                               {(currentUser?.email || '').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="একটি মন্তব্য লিখুন..."
                            className="flex-1 px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentText.trim()) {
                                handleAddComment(submission.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(submission.id)}
                            disabled={!commentText.trim()}
                            className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                          >
                            পাঠান
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {challengeSubmissions.length === 0 && currentChallenge && (
            <div className="text-center py-20">
             <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-16">
               <Trophy className="h-12 lg:h-20 w-12 lg:w-20 text-gray-300 mx-auto mb-4 lg:mb-8" />
               <h3 className="text-lg lg:text-2xl font-bold text-gray-900 mb-4">এখনো কোন প্রজেক্ট নেই</h3>
               <p className="text-gray-500 mb-4 lg:mb-8 text-sm lg:text-lg">প্রথম হয়ে আপনার প্রজেক্ট জমা দিন!</p>
                {canParticipate(currentChallenge) && (
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                   className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-sm lg:text-base"
                  >
                    প্রথম প্রজেক্ট জমা দিন
                  </button>
                )}
              </div>
            </div>
          )}

          {!currentChallenge && (
            <div className="text-center py-20">
             <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-16">
               <Calendar className="h-12 lg:h-20 w-12 lg:w-20 text-gray-300 mx-auto mb-4 lg:mb-8" />
               <h3 className="text-lg lg:text-2xl font-bold text-gray-900 mb-4">কোন সক্রিয় চ্যালেঞ্জ নেই</h3>
               <p className="text-gray-500 text-sm lg:text-lg">নতুন চ্যালেঞ্জের জন্য অপেক্ষা করুন!</p>
              </div>
            </div>
          )}
        </div>

        {/* Submission Modal */}
        {isSubmissionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl max-w-3xl w-full p-6 lg:p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl lg:text-3xl font-bold text-gray-900">প্রজেক্ট জমা দিন</h3>
                <button
                  onClick={() => setIsSubmissionModalOpen(false)}
                 className="p-2 lg:p-3 hover:bg-gray-100 rounded-full transition-colors text-xl lg:text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmissionSubmit} className="space-y-8">
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    প্রজেক্টের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={submissionForm.title}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
                  />
                </div>
                
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    প্রজেক্টের বিবরণ *
                  </label>
                  <textarea
                    required
                    value={submissionForm.description}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    rows={6}
                    placeholder="আপনার প্রজেক্ট সম্পর্কে বিস্তারিত লিখুন..."
                  />
                </div>
                
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    ইউটিউব ভিডিও লিংক *
                  </label>
                  <input
                    type="url"
                    required
                    value={submissionForm.youtubeUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, youtubeUrl: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    প্রজেক্টের ছবি (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.imageUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, imageUrl: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    ফাইল আপলোড করুন (ঐচ্ছিক)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    disabled={uploading}
                  />
                  {submissionForm.files.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {submissionForm.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center space-x-4">
                           <span className="text-2xl lg:text-3xl">{getFileIcon(file.type)}</span>
                            <div>
                             <p className="text-xs lg:text-sm font-semibold">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                           className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors text-lg lg:text-xl"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
               <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 pt-8">
                  <button
                    type="submit"
                    disabled={uploading}
                   className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 lg:py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-sm lg:text-lg shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'আপলোড হচ্ছে...' : 'প্রজেক্ট জমা দিন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSubmissionModalOpen(false)}
                   className="flex-1 bg-gray-200 text-gray-700 py-3 lg:py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-sm lg:text-lg"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {isPaymentModalOpen && currentChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl max-w-md w-full p-6 lg:p-10 shadow-2xl">
              <div className="text-center mb-8">
               <CreditCard className="h-12 lg:h-16 w-12 lg:w-16 text-orange-600 mx-auto mb-4" />
               <h3 className="text-xl lg:text-3xl font-bold text-gray-900 mb-2">পেমেন্ট করুন</h3>
                <p className="text-gray-600">৩০ দিনের চ্যালেঞ্জে অংশগ্রহণের জন্য</p>
              </div>
              
             <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 lg:p-6 mb-8 text-center">
                <p className="text-orange-800 font-semibold mb-2">পেমেন্ট পরিমাণ</p>
               <p className="text-2xl lg:text-3xl font-bold text-orange-900">৳{currentChallenge.price}</p>
                {currentChallenge.paymentNumber && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">পেমেন্ট নম্বর</p>
                   <p className="text-base lg:text-lg font-bold text-gray-900">{currentChallenge.paymentNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">বিকাশ/নগদ</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    আপনার পেমেন্ট নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.paymentNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                
                <div>
                 <label className="block text-sm lg:text-base font-bold text-gray-700 mb-3">
                    ট্রানজেকশন আইডি *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                   className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm lg:text-lg"
                    placeholder="TXN123456789"
                  />
                </div>
                
               <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 pt-6">
                  <button
                    type="submit"
                   className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 lg:py-4 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-bold text-sm lg:text-lg shadow-lg transform hover:scale-105"
                  >
                    পেমেন্ট জমা দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                   className="flex-1 bg-gray-200 text-gray-700 py-3 lg:py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-sm lg:text-lg"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* YouTube Player */}
        <YouTubePlayer
          videoId={playerState.videoId}
          isOpen={playerState.isOpen}
          onClose={closePlayer}
          title={playerState.title}
        />
      </div>
    </div>
  );
};

export default ChallengeSection;