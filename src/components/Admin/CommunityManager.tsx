import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Pin, PinOff, MessageSquare, Heart } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { Category, Post } from '../../types';
import toast from 'react-hot-toast';

const CommunityManager: React.FC = () => {
  const { documents: categories, addDocument: addCategory, updateDocument: updateCategory, deleteDocument: deleteCategory } = useFirestore('categories', 'createdAt');
  const { documents: posts, updateDocument: updatePost, deleteDocument: deletePost } = useFirestore('posts', 'createdAt');
  const [activeTab, setActiveTab] = useState('categories');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6'
    });
    setEditingCategory(null);
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        color: category.color
      });
      setEditingCategory(category);
    } else {
      resetCategoryForm();
    }
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        toast.success('ক্যাটাগরি আপডেট হয়েছে!');
      } else {
        await addCategory(categoryForm);
        toast.success('নতুন ক্যাটাগরি যোগ করা হয়েছে!');
      }
      closeCategoryModal();
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) {
      try {
        await deleteCategory(id);
        toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে!');
      } catch (error) {
        toast.error('মুছে ফেলতে সমস্যা হয়েছে!');
      }
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await updatePost(postId, { approved: true });
      toast.success('পোস্ট অনুমোদিত হয়েছে!');
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleRejectPost = async (postId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই পোস্টটি প্রত্যাখ্যান করতে চান?')) {
      try {
        await deletePost(postId);
        toast.success('পোস্ট প্রত্যাখ্যান করা হয়েছে!');
      } catch (error) {
        toast.error('সমস্যা হয়েছে!');
      }
    }
  };

  const handlePinPost = async (postId: string, pinned: boolean) => {
    try {
      await updatePost(postId, { pinned: !pinned });
      toast.success(pinned ? 'পোস্ট আনপিন করা হয়েছে!' : 'পোস্ট পিন করা হয়েছে!');
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'অজানা ক্যাটাগরি';
  };

  const pendingPosts = posts.filter((post: Post) => !post.approved);
  const approvedPosts = posts.filter((post: Post) => post.approved);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">কমিউনিটি ম্যানেজমেন্ট</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'categories', label: 'ক্যাটাগরি' },
            { id: 'pending', label: `অপেক্ষমাণ পোস্ট (${pendingPosts.length})` },
            { id: 'approved', label: 'অনুমোদিত পোস্ট' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ক্যাটাগরি তালিকা</h3>
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন ক্যাটাগরি</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category: Category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openCategoryModal(category)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Posts Tab */}
      {activeTab === 'pending' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">অপেক্ষমাণ পোস্ট</h3>
          <div className="space-y-4">
            {pendingPosts.map((post: Post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{post.title}</h4>
                    <p className="text-sm text-gray-600">
                      {post.authorName} • {getCategoryName(post.categoryId)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprovePost(post.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="অনুমোদন করুন"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRejectPost(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="প্রত্যাখ্যান করুন"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            ))}
            {pendingPosts.length === 0 && (
              <p className="text-gray-500 text-center py-8">কোন অপেক্ষমাণ পোস্ট নেই</p>
            )}
          </div>
        </div>
      )}

      {/* Approved Posts Tab */}
      {activeTab === 'approved' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">অনুমোদিত পোস্ট</h3>
          <div className="space-y-4">
            {approvedPosts.map((post: Post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{post.title}</h4>
                      {post.pinned && (
                        <Pin className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {post.authorName} • {getCategoryName(post.categoryId)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePinPost(post.id, post.pinned)}
                      className={`p-2 rounded-lg transition-colors ${
                        post.pinned
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={post.pinned ? 'আনপিন করুন' : 'পিন করুন'}
                    >
                      {post.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleRejectPost(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            ))}
            {approvedPosts.length === 0 && (
              <p className="text-gray-500 text-center py-8">কোন অনুমোদিত পোস্ট নেই</p>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি যোগ করুন'}
            </h3>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ক্যাটাগরির নাম
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ক্যাটাগরির নাম লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বিবরণ
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="ক্যাটাগরির বিবরণ লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  রঙ
                </label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryModal}
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

export default CommunityManager;