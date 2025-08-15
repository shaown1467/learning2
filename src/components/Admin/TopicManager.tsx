import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Upload, Image } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Topic } from '../../types';
import { uploadFile } from '../../utils/fileUpload';
import toast from 'react-hot-toast';

const TopicManager: React.FC = () => {
  const { documents: topics, addDocument, updateDocument, deleteDocument } = useSupabase('topics', 'order');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnail: '',
    order: 0
  });
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      thumbnail: '',
      order: topics.length
    });
    setEditingTopic(null);
  };

  const openModal = (topic?: Topic) => {
    if (topic) {
      setFormData({
        name: topic.name,
        description: topic.description,
        thumbnail: topic.thumbnail || '',
        order: topic.order
      });
      setEditingTopic(topic);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTopic) {
        await updateDocument(editingTopic.id, formData);
        toast.success('টপিক আপডেট হয়েছে!');
      } else {
        await addDocument(formData);
        toast.success('নতুন টপিক যোগ করা হয়েছে!');
      }
      closeModal();
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই টপিকটি মুছে ফেলতে চান?')) {
      try {
        await deleteDocument(id);
        toast.success('টপিক মুছে ফেলা হয়েছে!');
      } catch (error) {
        toast.error('মুছে ফেলতে সমস্যা হয়েছে!');
      }
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি আপলোড করুন!');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFile(file, 'topic-thumbnails');
      setFormData({ ...formData, thumbnail: url });
      toast.success('ছবি আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">টপিক ম্যানেজমেন্ট</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন টপিক</span>
        </button>
      </div>

      <div className="space-y-4">
        {topics.map((topic: Topic) => (
          <div key={topic.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <GripVertical className="h-5 w-5 text-gray-400" />
            {topic.thumbnail && (
              <img
                src={topic.thumbnail}
                alt={topic.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{topic.name}</h3>
              <p className="text-sm text-gray-600">{topic.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openModal(topic)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(topic.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingTopic ? 'টপিক এডিট করুন' : 'নতুন টপিক যোগ করুন'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  টপিকের নাম
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="টপিকের নাম লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বিবরণ
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="টপিকের বিবরণ লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  থাম্বনেইল ছবি
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                  />
                  {formData.thumbnail && (
                    <div className="relative">
                      <img
                        src={formData.thumbnail}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnail: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ক্রম নম্বর
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {uploading ? 'আপলোড হচ্ছে...' : editingTopic ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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

export default TopicManager;