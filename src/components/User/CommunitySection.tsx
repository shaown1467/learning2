import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Upload, X, Play, Download, FileText, Image as ImageIcon, Camera } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile } from '../../utils/fileUpload';
import { extractVideoId } from '../../utils/youtube';
import { Post, Comment, Category, UserProfile } from '../../types';

export const CommunitySection: React.FC = () => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    youtubeUrl: '',
    imageUrl: '',
    categoryId: '',
    files: [] as any[]
  });
  const [uploading, setUploading] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});

  const { currentUser } = useAuth();
  const { documents: posts, addDocument: addPost, updateDocument: updatePost } = useFirestore('posts', 'createdAt');
  const { documents: comments, addDocument: addComment } = useFirestore('comments', 'createdAt');
  const { documents: categories } = useFirestore('categories', 'createdAt');
  const { documents: userProfiles } = useFirestore('userProfiles');

  const currentUserProfile = userProfiles.find((profile: UserProfile) => profile.userId === currentUser?.uid);

  // Filter approved posts and sort by likes and creation date
  const approvedPosts = posts
    .filter((post: Post) => post.approved)
    .sort((a: Post, b: Post) => {
      // First sort by pinned posts
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Then by likes count
      const aLikes = a.likesCount || 0;
      const bLikes = b.likesCount || 0;
      if (aLikes !== bLikes) return bLikes - aLikes;
      
      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      youtubeUrl: '',
      imageUrl: '',
      categoryId: '',
      files: []
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newPost.title.trim() || !newPost.content.trim() || !newPost.categoryId) {
      toast.error('সব ফিল্ড পূরণ করুন!');
      return;
    }

    setUploading(true);
    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        youtubeUrl: newPost.youtubeUrl || '',
        imageUrl: newPost.imageUrl || '',
        files: newPost.files || [],
        categoryId: newPost.categoryId,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar || '',
        approved: false, // Needs admin approval
        pinned: false,
        likes: [],
        likesCount: 0,
        commentsCount: 0
      };

      await addPost(postData);
      resetForm();
      setShowCreatePost(false);
      toast.success('পোস্ট সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের পর এটি প্রদর্শিত হবে।');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('পোস্ট তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি আপলোড করুন!');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFile(file, 'community-images');
      setNewPost({ ...newPost, imageUrl: url });
      toast.success('ছবি আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
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
      setNewPost({
        ...newPost,
        files: [...newPost.files, ...uploadedFiles]
      });
      toast.success('ফাইল আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setNewPost({
      ...newPost,
      files: newPost.files.filter(f => f.id !== fileId)
    });
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const post = posts.find((p: Post) => p.id === postId);
      if (!post) return;

      const likes = post.likes || [];
      const isLiked = likes.includes(currentUser.uid);
      const updatedLikes = isLiked 
        ? likes.filter((id: string) => id !== currentUser.uid)
        : [...likes, currentUser.uid];

      await updatePost(postId, { 
        likes: updatedLikes,
        likesCount: updatedLikes.length
      });
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('লাইক করতে সমস্যা হয়েছে!');
    }
  };

  const handleComment = async (postId: string) => {
    if (!currentUser || !commentTexts[postId]?.trim()) return;

    try {
      await addComment({
        postId,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.displayName || currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        authorAvatar: currentUserProfile?.avatar || '',
        content: commentTexts[postId]
      });

      // Update post comment count
      const post = posts.find((p: Post) => p.id === postId);
      if (post) {
        await updatePost(postId, {
          commentsCount: post.commentsCount + 1
        });
      }

      setCommentTexts({ ...commentTexts, [postId]: '' });
      toast.success('মন্তব্য যোগ করা হয়েছে!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('মন্তব্য করতে সমস্যা হয়েছে!');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'অজানা ক্যাটাগরি';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.color : '#3B82F6';
  };

  const getPostComments = (postId: string) => {
    return comments.filter((comment: Comment) => comment.postId === postId);
  };

  const isPostLiked = (post: Post) => {
    return currentUser ? post.likes?.includes(currentUser.uid) : false;
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

  const renderYouTubeEmbed = (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    return (
      <div className="relative w-full h-48 bg-gray-900 rounded-xl overflow-hidden mb-4">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">কমিউনিটি</h1>
        <p className="text-gray-600">সবার সাথে আপনার অভিজ্ঞতা শেয়ার করুন</p>
      </div>

      {/* Create Post Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
        >
          <Upload className="h-5 w-5" />
          <span>নতুন পোস্ট তৈরি করুন</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">নতুন পোস্ট তৈরি করুন</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  পোস্টের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ক্যাটাগরি *
                </label>
                <select
                  required
                  value={newPost.categoryId}
                  onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  পোস্টের বিবরণ *
                </label>
                <textarea
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="আপনার মতামত বা অভিজ্ঞতা শেয়ার করুন..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ইউটিউব ভিডিও লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  value={newPost.youtubeUrl}
                  onChange={(e) => setNewPost({ ...newPost, youtubeUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ছবি আপলোড (ঐচ্ছিক)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                {newPost.imageUrl && (
                  <div className="mt-2 relative">
                    <img
                      src={newPost.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPost({ ...newPost, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ফাইল আপলোড (ঐচ্ছিক)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                {newPost.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newPost.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newPost.title.trim() || !newPost.content.trim() || !newPost.categoryId}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {approvedPosts.map((post: Post) => {
          const postComments = getPostComments(post.id);
          
          return (
            <div key={post.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 max-w-2xl mx-auto hover:shadow-lg transition-shadow">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {post.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(new Date(post.createdAt))}
                      </span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(post.categoryId) }}
                      >
                        {getCategoryName(post.categoryId)}
                      </span>
                      {post.pinned && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          পিন করা
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <h2 className="text-lg font-bold text-gray-900 mb-3">{post.title}</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

              {/* YouTube Video */}
              {post.youtubeUrl && renderYouTubeEmbed(post.youtubeUrl)}

              {/* Image */}
              {post.imageUrl && (
                <div className="mb-4">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Files */}
              {post.files && post.files.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">সংযুক্ত ফাইল:</h4>
                  <div className="space-y-2">
                    {post.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        download={file.name}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="flex-1 text-gray-900">{file.name}</span>
                        <Download className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isPostLiked(post) 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isPostLiked(post) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likesCount || 0}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                  </div>
                </div>

                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Comments */}
              {postComments.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  {postComments.map((comment: Comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      {comment.authorAvatar ? (
                        <img
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">{comment.authorName}</p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Input */}
              <div className="mt-4 flex space-x-3">
                {currentUserProfile?.avatar ? (
                  <img
                    src={currentUserProfile.avatar}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {currentUser?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                    placeholder="একটি মন্তব্য লিখুন..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    পোস্ট
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {approvedPosts.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">কোনো পোস্ট নেই</h3>
            <p className="text-gray-600">প্রথম পোস্ট তৈরি করুন এবং কমিউনিটির সাথে শেয়ার করুন!</p>
          </div>
        )}
      </div>
    </div>
  );
};