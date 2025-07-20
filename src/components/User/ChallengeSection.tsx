import React, { useState } from 'react';
import { Trophy, Calendar, Users, Heart, MessageSquare, Play, Upload, File, Download, CreditCard, Clock, Star } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { Challenge, ChallengeSubmission, ChallengeComment, ChallengePayment, UserProfile } from '../../types';
import { extractVideoId, getThumbnailUrl } from '../../utils/youtube';
import { uploadFile, formatFileSize, getFileIcon } from '../../utils/fileUpload';
import YouTubePlayer from '../Common/YouTubePlayer';
import toast from 'react-hot-toast';

const ChallengeSection: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents: challenges } = useFirestore('challenges', 'createdAt');
  const { documents: submissions, addDocument: addSubmission, updateDocument: updateSubmission } = useFirestore('challengeSubmissions', 'likesCount');
  const { documents: comments, addDocument: addComment } = useFirestore('challengeComments', 'createdAt');
  const { documents: payments, addDocument: addPayment } = useFirestore('challengePayments', 'createdAt');
  const { documents: userProfiles } = useFirestore('userProfiles');
  
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
  
  const activeChallenge7Day = challenges.find((c: Challenge) => c.type === '7day' && c.isActive);
  const activeChallenge30Day = challenges.find((c: Challenge) => c.type === '30day' && c.isActive);
  
  const currentChallenge = activeTab === '7day' ? activeChallenge7Day : activeChallenge30Day;
  
  const challengeSubmissions = submissions
    .filter((s: ChallengeSubmission) => 
      s.challengeType === activeTab && 
      s.approved &&
      (currentChallenge ? s.challengeId === currentChallenge.id : false)
    )
    .sort((a: ChallengeSubmission, b: ChallengeSubmission) => b.likesCount - a.likesCount);

  const userPayment = currentChallenge ? payments.find((p: ChallengePayment) => 
    p.challengeId === currentChallenge.id && 
    p.userId === currentUser?.uid &&
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
        challengeId: currentChallenge.id,
        challengeType: activeTab,
        userId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar,
        title: submissionForm.title,
        description: submissionForm.description,
        youtubeUrl: submissionForm.youtubeUrl,
        videoId,
        imageUrl: submissionForm.imageUrl,
        files: submissionForm.files,
        approved: false,
        likes: [],
        likesCount: 0,
        commentsCount: 0
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
        challengeId: currentChallenge.id,
        userId: currentUser.uid,
        userName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        userEmail: currentUser.email || '',
        paymentNumber: paymentForm.paymentNumber,
        transactionId: paymentForm.transactionId,
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
        likesCount: newLikes.length
      });
    } catch (error) {
      toast.error('লাইক করতে সমস্যা হয়েছে!');
    }
  };

  const handleAddComment = async (submissionId: string) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      await addComment({
        submissionId,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar,
        content: commentText
      });

      // Update submission comment count
      const submission = submissions.find((s: ChallengeSubmission) => s.id === submissionId);
      if (submission) {
        await updateSubmission(submissionId, {
          commentsCount: submission.commentsCount + 1
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
    return comments.filter((comment: ChallengeComment) => comment.submissionId === submissionId);
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-10 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-300 animate-bounce" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
              চ্যালেঞ্জ সেকশন
            </h1>
            <p className="text-purple-100 text-lg mb-6">আপনার দক্ষতা প্রমাণ করুন এবং পুরস্কার জিতুন!</p>
            <div className="flex justify-center space-x-6 text-purple-100">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>৭ দিনের চ্যালেঞ্জ - ফ্রি</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>৩০ দিনের চ্যালেঞ্জ - প্রিমিয়াম</span>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 flex space-x-2">
            <button
              onClick={() => setActiveTab('7day')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
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
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
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
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{currentChallenge.title}</h2>
                <p className="text-gray-600 text-lg mb-4">{currentChallenge.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>শুরু: {new Date(currentChallenge.startDate).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>শেষ: {new Date(currentChallenge.endDate).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{challengeSubmissions.length} জন অংশগ্রহণকারী</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                {currentChallenge.type === '30day' && currentChallenge.price > 0 && !userPayment && (
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 mb-4">
                      <CreditCard className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-orange-800 font-semibold">প্রিমিয়াম চ্যালেঞ্জ</p>
                      <p className="text-2xl font-bold text-orange-900">৳{currentChallenge.price}</p>
                    </div>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                    >
                      পেমেন্ট করুন
                    </button>
                  </div>
                )}
                
                {canParticipate(currentChallenge) && (
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center space-x-2"
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
              <div key={submission.id} className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 transform hover:-translate-y-2">
                {/* Rank Badge */}
                {index < 3 && (
                  <div className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-full text-white font-bold shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    #{index + 1}
                  </div>
                )}

                {/* Submission Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {submission.authorAvatar ? (
                          <img
                            src={submission.authorAvatar}
                            alt={submission.authorName}
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-100 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center ring-4 ring-purple-100 shadow-lg">
                            <span className="text-white font-bold text-xl">
                              {submission.authorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl">{submission.authorName}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 font-medium">{formatTimeAgo(submission.createdAt)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            activeTab === '7day' ? 'bg-purple-500' : 'bg-orange-500'
                          }`}>
                            {activeTab === '7day' ? '৭ দিনের চ্যালেঞ্জ' : '৩০ দিনের চ্যালেঞ্জ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Content */}
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{submission.title}</h2>
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg">{submission.description}</p>
                  
                  {/* Video Thumbnail */}
                  <div className="mb-8">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={getThumbnailUrl(submission.videoId, 'maxres')}
                        alt={submission.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPlayer(submission.videoId, submission.title)}
                          className="bg-white text-gray-900 p-4 rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110"
                        >
                          <Play className="h-8 w-8" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {submission.imageUrl && (
                    <div className="mb-8">
                      <img
                        src={submission.imageUrl}
                        alt="Project"
                        className="w-full max-w-4xl h-96 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                      />
                    </div>
                  )}
                  
                  {submission.files && submission.files.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                        <File className="h-6 w-6 mr-3 text-purple-600" />
                        সংযুক্ত ফাইল ({submission.files.length}টি)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {submission.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            download={file.name}
                            className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:shadow-lg group transform hover:scale-105"
                          >
                            <span className="text-4xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Download className="h-6 w-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission Actions */}
                <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      <button 
                        onClick={() => toggleLike(submission.id)}
                        className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                          isSubmissionLiked(submission) 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-lg' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 hover:shadow-lg'
                        }`}
                      >
                        <Heart className={`h-6 w-6 ${isSubmissionLiked(submission) ? 'fill-current' : ''}`} />
                        <span className="font-bold text-lg">{submission.likesCount}</span>
                        <span className="text-sm font-semibold">লাইক</span>
                      </button>
                      <button
                        onClick={() => setShowComments(showComments === submission.id ? null : submission.id)}
                        className="flex items-center space-x-3 px-6 py-3 rounded-2xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span className="font-bold text-lg">{submission.commentsCount}</span>
                        <span className="text-sm font-semibold">মন্তব্য</span>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {submission.likesCount > 0 && (
                        <span className="bg-gray-100 px-4 py-2 rounded-full">
                          {submission.likesCount} জন লাইক করেছেন
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments === submission.id && (
                  <div className="border-t border-gray-100 bg-white">
                    <div className="p-8">
                      <div className="space-y-6 mb-8">
                        {submissionComments.map((comment: ChallengeComment) => (
                          <div key={comment.id} className="flex space-x-4">
                            <div className="flex-shrink-0">
                              {comment.authorAvatar ? (
                                <img
                                  src={comment.authorAvatar}
                                  alt={comment.authorName}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {comment.authorName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gradient-to-r from-gray-100 to-purple-50 rounded-2xl px-6 py-4 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center space-x-3 mb-2">
                                  <p className="font-bold text-sm text-gray-900">{comment.authorName}</p>
                                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {submissionComments.length === 0 && (
                          <div className="text-center py-12">
                            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">এখনো কোন মন্তব্য নেই। প্রথম মন্তব্য করুন!</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Input */}
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          {currentUserProfile?.avatar ? (
                            <img
                              src={currentUserProfile.avatar}
                              alt="Your avatar"
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {currentUser?.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex space-x-4">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="একটি মন্তব্য লিখুন..."
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentText.trim()) {
                                handleAddComment(submission.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(submission.id)}
                            disabled={!commentText.trim()}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
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
              <div className="bg-white rounded-3xl shadow-xl p-16">
                <Trophy className="h-20 w-20 text-gray-300 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">এখনো কোন প্রজেক্ট নেই</h3>
                <p className="text-gray-500 mb-8 text-lg">প্রথম হয়ে আপনার প্রজেক্ট জমা দিন!</p>
                {canParticipate(currentChallenge) && (
                  <button
                    onClick={() => setIsSubmissionModalOpen(true)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                  >
                    প্রথম প্রজেক্ট জমা দিন
                  </button>
                )}
              </div>
            </div>
          )}

          {!currentChallenge && (
            <div className="text-center py-20">
              <div className="bg-white rounded-3xl shadow-xl p-16">
                <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">কোন সক্রিয় চ্যালেঞ্জ নেই</h3>
                <p className="text-gray-500 text-lg">নতুন চ্যালেঞ্জের জন্য অপেক্ষা করুন!</p>
              </div>
            </div>
          )}
        </div>

        {/* Submission Modal */}
        {isSubmissionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-gray-900">প্রজেক্ট জমা দিন</h3>
                <button
                  onClick={() => setIsSubmissionModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmissionSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    প্রজেক্টের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={submissionForm.title}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    প্রজেক্টের বিবরণ *
                  </label>
                  <textarea
                    required
                    value={submissionForm.description}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                    rows={6}
                    placeholder="আপনার প্রজেক্ট সম্পর্কে বিস্তারিত লিখুন..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    ইউটিউব ভিডিও লিংক *
                  </label>
                  <input
                    type="url"
                    required
                    value={submissionForm.youtubeUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, youtubeUrl: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    প্রজেক্টের ছবি (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.imageUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, imageUrl: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    ফাইল আপলোড করুন (ঐচ্ছিক)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    disabled={uploading}
                  />
                  {submissionForm.files.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {submissionForm.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{getFileIcon(file.type)}</span>
                            <div>
                              <p className="text-sm font-semibold">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors text-xl"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-6 pt-8">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'আপলোড হচ্ছে...' : 'প্রজেক্ট জমা দিন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSubmissionModalOpen(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-lg"
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
            <div className="bg-white rounded-3xl max-w-md w-full p-10 shadow-2xl">
              <div className="text-center mb-8">
                <CreditCard className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">পেমেন্ট করুন</h3>
                <p className="text-gray-600">৩০ দিনের চ্যালেঞ্জে অংশগ্রহণের জন্য</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 mb-8 text-center">
                <p className="text-orange-800 font-semibold mb-2">পেমেন্ট পরিমাণ</p>
                <p className="text-3xl font-bold text-orange-900">৳{currentChallenge.price}</p>
                {currentChallenge.paymentNumber && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">পেমেন্ট নম্বর</p>
                    <p className="text-lg font-bold text-gray-900">{currentChallenge.paymentNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">বিকাশ/নগদ</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    আপনার পেমেন্ট নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.paymentNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    ট্রানজেকশন আইডি *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="TXN123456789"
                  />
                </div>
                
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-bold text-lg shadow-lg transform hover:scale-105"
                  >
                    পেমেন্ট জমা দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-lg"
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