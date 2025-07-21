import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Upload, X, Play, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile } from '../../utils/fileUpload';
import { extractVideoId } from '../../utils/youtube';

interface Post {
  id: string;
  title: string;
  description: string;
  youtubeUrl?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  likes: string[];
  comments: Comment[];
  createdAt: any;
  approved: boolean;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: any;
}

export const CommunitySection: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});

  const { user } = useAuth();
  const { addDocument, getDocuments, updateDocument } = useFirestore();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const postsData = await getDocuments('communityPosts');
      const approvedPosts = postsData
        .filter((post: any) => post.approved)
        .sort((a: any, b: any) => {
          const aLikes = a.likes?.length || 0;
          const bLikes = b.likes?.length || 0;
          if (aLikes !== bLikes) return bLikes - aLikes;
          return b.createdAt?.seconds - a.createdAt?.seconds;
        });
      setPosts(approvedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.description.trim()) return;

    setUploading(true);
    try {
      let fileUrl = '';
      let fileName = '';
      let fileType = '';

      if (newPost.file) {
        const uploadResult = await uploadFile(newPost.file, 'community');
        fileUrl = uploadResult.url;
        fileName = newPost.file.name;
        fileType = newPost.file.type;
      }

      const postData = {
        title: newPost.title,
        description: newPost.description,
        youtubeUrl: newPost.youtubeUrl || '',
        fileUrl,
        fileName,
        fileType,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        likes: [],
        comments: [],
        createdAt: new Date(),
        approved: false
      };

      await addDocument('communityPosts', postData);
      setNewPost({ title: '', description: '', youtubeUrl: '', file: null });
      setShowCreatePost(false);
      alert('পোস্ট সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের পর এটি প্রদর্শিত হবে।');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('পোস্ট তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const likes = post.likes || [];
      const isLiked = likes.includes(user.uid);
      const updatedLikes = isLiked 
        ? likes.filter(id => id !== user.uid)
        : [...likes, user.uid];

      await updateDocument('communityPosts', postId, { likes: updatedLikes });
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: updatedLikes }
          : p
      ));
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !commentTexts[postId]?.trim()) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const newComment = {
        id: Date.now().toString(),
        text: commentTexts[postId],
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        createdAt: new Date()
      };

      const updatedComments = [...(post.comments || []), newComment];
      await updateDocument('communityPosts', postId, { comments: updatedComments });
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, comments: updatedComments }
          : p
      ));

      setCommentTexts({ ...commentTexts, [postId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderYouTubeEmbed = (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    return (
      <div className="relative w-full h-48 bg-gray-900 rounded-xl overflow-hidden">
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

  const renderFileAttachment = (post: Post) => {
    if (!post.fileUrl) return null;

    const isImage = post.fileType?.startsWith('image/');
    
    return (
      <div className="mt-3">
        {isImage ? (
          <img 
            src={post.fileUrl} 
            alt={post.fileName}
            className="w-full h-48 object-cover rounded-xl"
          />
        ) : (
          <div className="flex items-center p-3 bg-gray-50 rounded-xl border">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{post.fileName}</p>
              <p className="text-xs text-gray-500">ফাইল ডাউনলোড করুন</p>
            </div>
            <a
              href={post.fileUrl}
              download={post.fileName}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">কমিউনিটি</h2>
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          নতুন পোস্ট
        </button>
      </div>

      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">নতুন পোস্ট তৈরি করুন</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="পোস্টের শিরোনাম"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <textarea
                placeholder="পোস্টের বিবরণ"
                value={newPost.description}
                onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <input
                type="url"
                placeholder="ইউটিউব ভিডিও লিংক (ঐচ্ছিক)"
                value={newPost.youtubeUrl}
                onChange={(e) => setNewPost({ ...newPost, youtubeUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ফাইল আপলোড (ঐচ্ছিক)
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewPost({ ...newPost, file: e.target.files?.[0] || null })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={uploading || !newPost.title.trim() || !newPost.description.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'আপলোড হচ্ছে...' : 'পোস্ট করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 max-w-2xl mx-auto">
            <div className="flex items-center mb-3">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-12 h-12 rounded-full mr-3"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{post.authorName}</h3>
                <p className="text-gray-500 text-sm">
                  {post.createdAt?.toDate?.()?.toLocaleDateString('bn-BD') || 'আজ'}
                </p>
              </div>
            </div>

            <h4 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h4>
            <p className="text-gray-700 mb-3 text-sm leading-relaxed">{post.description}</p>

            {post.youtubeUrl && renderYouTubeEmbed(post.youtubeUrl)}
            {renderFileAttachment(post)}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    post.likes?.includes(user?.uid || '') 
                      ? 'bg-red-50 text-red-600' 
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      post.likes?.includes(user?.uid || '') ? 'fill-current' : ''
                    }`} 
                  />
                  <span className="text-sm">{post.likes?.length || 0}</span>
                </button>

                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comments?.length || 0}</span>
                </button>
              </div>

              <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {post.comments && post.comments.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <p className="font-medium text-gray-900 text-sm">{comment.authorName}</p>
                      <p className="text-gray-700 text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="একটি মন্তব্য লিখুন..."
                value={commentTexts[post.id] || ''}
                onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">কোনো পোস্ট নেই</h3>
            <p className="text-gray-600">প্রথম পোস্ট তৈরি করুন এবং কমিউনিটির সাথে শেয়ার করুন!</p>
          </div>
        )}
      </div>
    </div>
  );
};