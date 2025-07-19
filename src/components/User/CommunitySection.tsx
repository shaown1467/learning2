import React, { useState } from 'react';
import { Plus, Heart, MessageSquare, Share2, Pin, Image, Send, Upload, File, Download } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { Category, Post, Comment } from '../../types';
import { uploadFile, formatFileSize, getFileIcon } from '../../utils/fileUpload';
import toast from 'react-hot-toast';

const CommunitySection: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents: categories } = useFirestore('categories', 'createdAt');
  const { documents: posts, addDocument: addPost } = useFirestore('posts', 'createdAt');
  const { documents: comments, addDocument: addComment } = useFirestore('comments', 'createdAt');
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
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

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
        authorName: currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
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

  const toggleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (likedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
    // Here you would also update the post in Firebase
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      await addComment({
        postId,
        authorId: currentUser.uid,
        authorName: currentUser.email?.split('@')[0] || 'ব্যবহারকারী',
        content: commentText
      });
      
      setCommentText('');
      toast.success('মন্তব্য যোগ করা হয়েছে!');
    } catch (error) {
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

  const filteredPosts = posts
    .filter((post: Post) => post.approved)
    .filter((post: Post) => selectedCategory === 'all' || post.categoryId === selectedCategory)
    .sort((a: Post, b: Post) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কমিউনিটি</h1>
          <p className="text-gray-600">সবার সাথে আপনার অভিজ্ঞতা শেয়ার করুন</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন পোস্ট</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            সব পোস্ট
          </button>
          {categories.map((category: Category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : undefined
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.map((post: Post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {post.authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getCategoryColor(post.categoryId) }}
                    >
                      {getCategoryName(post.categoryId)}
                    </span>
                    {post.pinned && (
                      <Pin className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-4">{post.content}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="w-full max-w-2xl h-64 object-cover rounded-lg"
                />
              )}
              
              {post.files && post.files.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">সংযুক্ত ফাইল:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {post.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        download={file.name}
                        className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
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
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    likedPosts.has(post.id) 
                      ? 'text-red-600' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                  <span>{post.likesCount}</span>
                </button>
                <button
                  onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>{post.commentsCount}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                  <Share2 className="h-5 w-5" />
                  <span>শেয়ার</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3 mb-4">
                  {getPostComments(post.id).map((comment: Comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-semibold">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <p className="font-semibold text-sm text-gray-900">{comment.authorName}</p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {currentUser?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="একটি মন্তব্য লিখুন..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">কোন পোস্ট নেই</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">নতুন পোস্ট তৈরি করুন</h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="পোস্টের শিরোনাম লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বিষয়বস্তু
                </label>
                <textarea
                  required
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="আপনার মতামত লিখুন..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  required
                  value={postForm.categoryId}
                  onChange={(e) => setPostForm({ ...postForm, categoryId: e.target.value })}
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
                  ছবির লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  value={postForm.imageUrl}
                  onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ফাইল আপলোড করুন (ঐচ্ছিক)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                {postForm.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {postForm.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span>{getFileIcon(file.type)}</span>
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {uploading ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySection;