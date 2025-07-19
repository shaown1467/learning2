import React, { useState } from 'react';
import { Plus, Heart, MessageSquare, Share2, Pin, Image, Send, Upload, File, Download, Users, TrendingUp } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { Category, Post, Comment, UserProfile } from '../../types';
import { uploadFile, formatFileSize, getFileIcon } from '../../utils/fileUpload';
import toast from 'react-hot-toast';

const CommunitySection: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents: categories } = useFirestore('categories', 'createdAt');
  const { documents: posts, addDocument: addPost, updateDocument: updatePost } = useFirestore('posts', 'createdAt');
  const { documents: comments, addDocument: addComment } = useFirestore('comments', 'createdAt');
  const { documents: userProfiles, updateDocument: updateUserProfile } = useFirestore('userProfiles');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    imageUrl: '',
    files: [] as any[]
  });
  const [uploading, setUploading] = useState(false);

  const currentUserProfile = userProfiles.find((profile: UserProfile) => profile.userId === currentUser?.uid);

  const resetPostForm = () => {
    setPostForm({
      title: '',
      content: '',
      categoryId: '',
      imageUrl: '',
      files: []
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      await addPost({
        ...postForm,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar,
        approved: false,
        pinned: false,
        likes: [],
        likesCount: 0,
        commentsCount: 0
      });
      
      toast.success('পোস্ট জমা দেওয়া হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।');
      setIsCreateModalOpen(false);
      resetPostForm();
    } catch (error) {
      toast.error('পোস্ট করতে সমস্যা হয়েছে!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadFile(file, 'community-files');
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          url,
          size: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setPostForm({
        ...postForm,
        files: [...postForm.files, ...uploadedFiles]
      });
      toast.success('ফাইল আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setPostForm({
      ...postForm,
      files: postForm.files.filter(f => f.id !== fileId)
    });
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find((p: Post) => p.id === postId);
    if (!post) return;

    try {
      const hasLiked = post.likes.includes(currentUser.uid);
      let newLikes;
      
      if (hasLiked) {
        newLikes = post.likes.filter((uid: string) => uid !== currentUser.uid);
      } else {
        newLikes = [...post.likes, currentUser.uid];
      }

      await updatePost(postId, {
        likes: newLikes,
        likesCount: newLikes.length
      });

      // Award points for first like given
      if (!hasLiked && currentUserProfile) {
        await updateUserProfile(currentUserProfile.id, {
          points: currentUserProfile.points + 1
        });
      }
    } catch (error) {
      toast.error('লাইক করতে সমস্যা হয়েছে!');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      await addComment({
        postId,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar,
        content: commentText
      });

      // Update post comment count
      const post = posts.find((p: Post) => p.id === postId);
      if (post) {
        await updatePost(postId, {
          commentsCount: post.commentsCount + 1
        });
      }

      // Award points for commenting
      if (currentUserProfile) {
        await updateUserProfile(currentUserProfile.id, {
          points: currentUserProfile.points + 2
        });
      }
      
      setCommentText('');
      toast.success('মন্তব্য যোগ করা হয়েছে!');
    } catch (error) {
      toast.error('মন্তব্য করতে সমস্যা হয়েছে!');
    }
  };

  const isPostLiked = (post: Post) => {
    return currentUser ? post.likes.includes(currentUser.uid) : false;
  };

  const getPostComments = (postId: string) => {
    return comments.filter((comment: Comment) => comment.postId === postId);
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'অজানা ক্যাটাগরি';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.color : '#3B82F6';
  };

  const filteredPosts = posts
    .filter((post: Post) => post.approved)
    .filter((post: Post) => selectedCategory === 'all' || post.categoryId === selectedCategory)
    .sort((a: Post, b: Post) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Header with gradient and animations */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl text-white p-8 mb-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-10 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                কমিউনিটি
              </h1>
              <p className="text-blue-100 text-lg mb-4">সবার সাথে আপনার অভিজ্ঞতা শেয়ার করুন এবং একসাথে শিখুন</p>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{posts.filter((p: Post) => p.approved).length} পোস্ট</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>সক্রিয় কমিউনিটি</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white px-8 py-4 rounded-2xl hover:bg-opacity-30 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105"
            >
              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold text-lg">নতুন পোস্ট</span>
            </button>
          </div>
        </div>

        {/* Enhanced Category Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
              ক্যাটাগরি অনুযায়ী ফিল্টার করুন
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`group px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>সব পোস্ট</span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {posts.filter((p: Post) => p.approved).length}
                  </span>
                </span>
              </button>
              {categories.map((category: Category) => {
                const categoryPostCount = posts.filter((p: Post) => p.approved && p.categoryId === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      selectedCategory === category.id
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category.name}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                        {categoryPostCount}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Posts */}
        <div className="space-y-8">
          {filteredPosts.map((post: Post) => {
            const postComments = getPostComments(post.id);
            
            return (
              <div key={post.id} className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 transform hover:-translate-y-2">
                {/* Enhanced Post Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {post.authorAvatar ? (
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-4 ring-blue-100 shadow-lg">
                            <span className="text-white font-bold text-xl">
                              {post.authorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl">{post.authorName}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
                            style={{ backgroundColor: getCategoryColor(post.categoryId) }}
                          >
                            {getCategoryName(post.categoryId)}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">{formatTimeAgo(post.createdAt)}</span>
                          {post.pinned && (
                            <div className="flex items-center space-x-2 text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                              <Pin className="h-4 w-4" />
                              <span className="text-sm font-semibold">পিন করা</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Post Content */}
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h2>
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg">{post.content}</p>
                  
                  {post.imageUrl && (
                    <div className="mb-8">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full max-w-4xl h-96 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                      />
                    </div>
                  )}
                  
                  {post.files && post.files.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                        <File className="h-6 w-6 mr-3 text-blue-600" />
                        সংযুক্ত ফাইল ({post.files.length}টি)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {post.files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            download={file.name}
                            className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg group transform hover:scale-105"
                          >
                            <span className="text-4xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Download className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Post Actions */}
                <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                          isPostLiked(post) 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-lg' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 hover:shadow-lg'
                        }`}
                      >
                        <Heart className={`h-6 w-6 ${isPostLiked(post) ? 'fill-current' : ''}`} />
                        <span className="font-bold text-lg">{post.likesCount}</span>
                        <span className="text-sm font-semibold">লাইক</span>
                      </button>
                      <button
                        onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                        className="flex items-center space-x-3 px-6 py-3 rounded-2xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span className="font-bold text-lg">{post.commentsCount}</span>
                        <span className="text-sm font-semibold">মন্তব্য</span>
                      </button>
                      <button className="flex items-center space-x-3 px-6 py-3 rounded-2xl text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                        <Share2 className="h-6 w-6" />
                        <span className="text-sm font-semibold">শেয়ার</span>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {post.likesCount > 0 && (
                        <span className="bg-gray-100 px-4 py-2 rounded-full">
                          {post.likesCount} জন লাইক করেছেন
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Comments Section */}
                {showComments === post.id && (
                  <div className="border-t border-gray-100 bg-white">
                    <div className="p-8">
                      <div className="space-y-6 mb-8">
                        {postComments.map((comment: Comment) => (
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
                              <div className="bg-gradient-to-r from-gray-100 to-blue-50 rounded-2xl px-6 py-4 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 shadow-sm hover:shadow-md">
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
                        
                        {postComments.length === 0 && (
                          <div className="text-center py-12">
                            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">এখনো কোন মন্তব্য নেই। প্রথম মন্তব্য করুন!</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Comment Input */}
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          {currentUserProfile?.avatar ? (
                            <img
                              src={currentUserProfile.avatar}
                              alt="Your avatar"
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && commentText.trim()) {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentText.trim()}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <Send className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white rounded-3xl shadow-xl p-16">
                <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">কোন পোস্ট নেই</h3>
                <p className="text-gray-500 mb-8 text-lg">এই ক্যাটাগরিতে এখনো কোন পোস্ট করা হয়নি।</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                >
                  প্রথম পোস্ট করুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Create Post Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-gray-900">নতুন পোস্ট তৈরি করুন</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    বিষয়বস্তু *
                  </label>
                  <textarea
                    required
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    rows={8}
                    placeholder="আপনার চিন্তাভাবনা, অভিজ্ঞতা বা প্রশ্ন শেয়ার করুন..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    ক্যাটাগরি *
                  </label>
                  <select
                    required
                    value={postForm.categoryId}
                    onChange={(e) => setPostForm({ ...postForm, categoryId: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    ছবির লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    value={postForm.imageUrl}
                    onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
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
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={uploading}
                  />
                  {postForm.files.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {postForm.files.map((file) => (
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-lg"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitySection;