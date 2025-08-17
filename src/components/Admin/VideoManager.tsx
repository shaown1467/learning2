import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, ExternalLink, Upload, File, Download } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Video, Topic } from '../../types';
import { extractVideoId, getThumbnailUrl } from '../../utils/youtube';
import { uploadFile, formatFileSize, getFileIcon } from '../../utils/fileUpload';
import YouTubePlayer from '../Common/YouTubePlayer';
import toast from 'react-hot-toast';

const VideoManager: React.FC = () => {
  const { documents: videos, addDocument, updateDocument, deleteDocument } = useSupabase('videos', 'order');
  const { documents: topics } = useSupabase('topics', 'order');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [playerState, setPlayerState] = useState({ isOpen: false, videoId: '', title: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    topicId: '',
    files: [] as any[],
    order: 0
  });
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      topicId: '',
      files: [],
      order: videos.length
    });
    setEditingVideo(null);
  };

  const openModal = (video?: Video) => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        youtubeUrl: video.youtubeUrl,
        topicId: video.topicId,
        files: video.files || [],
        order: video.order
      });
      setEditingVideo(video);
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
    
    const videoId = extractVideoId(formData.youtubeUrl);
    if (!videoId) {
      toast.error('সঠিক ইউটিউব লিংক দিন!');
      return;
    }

    try {
      const videoData = {
        ...formData,
        videoId
      };

        topic_id: videoForm.topicId,
        await updateDocument(editingVideo.id, videoData);
        toast.success('ভিডিও আপডেট হয়েছে!');
      } else {
        await addDocument(videoData);
        toast.success('নতুন ভিডিও যোগ করা হয়েছে!');
      }
      closeModal();
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ভিডিওটি মুছে ফেলতে চান?')) {
      try {
        await deleteDocument(id);
        toast.success('ভিডিও মুছে ফেলা হয়েছে!');
      } catch (error) {
        toast.error('মুছে ফেলতে সমস্যা হয়েছে!');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadFile(file, 'video-files');
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          url,
          size: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFormData({
        ...formData,
        files: [...formData.files, ...uploadedFiles]
      });
      toast.success('ফাইল আপলোড হয়েছে!');
    } catch (error) {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFormData({
      ...formData,
      files: formData.files.filter(f => f.id !== fileId)
    });
  };

  const openPlayer = (videoId: string, title: string) => {
    setPlayerState({ isOpen: true, videoId, title });
  };

  const closePlayer = () => {
    setPlayerState({ isOpen: false, videoId: '', title: '' });
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find((t: Topic) => t.id === topicId);
    return topic ? topic.name : 'অজানা টপিক';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">ভিডিও ম্যানেজমেন্ট</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন ভিডিও</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video: Video) => (
          <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="relative">
              <img
                src={getThumbnailUrl(video.videoId)}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openPlayer(video.videoId, video.title)}
                  className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors mr-2"
                >
                  <Play className="h-5 w-5" />
                </button>
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{video.description}</p>
              <p className="text-xs text-blue-600 mb-3">{getTopicName(video.topicId)}</p>
              
              {video.files && video.files.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">{video.files.length} টি ফাইল</p>
                  <div className="flex flex-wrap gap-1">
                    {video.files.slice(0, 3).map((file, index) => (
                      <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getFileIcon(file.type)} {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                      </span>
                    ))}
                    {video.files.length > 3 && (
                      <span className="text-xs text-gray-500">+{video.files.length - 3} আরো</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">ক্রম: {video.order}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(video)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingVideo ? 'ভিডিও এডিট করুন' : 'নতুন ভিডিও যোগ করুন'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ভিডিওর শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ভিডিওর শিরোনাম লিখুন"
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
                  placeholder="ভিডিওর বিবরণ লিখুন"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ইউটিউব লিংক
                </label>
                <input
                  type="url"
                  required
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  টপিক
                </label>
                <select
                  required
                  value={formData.topicId}
                  onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">টপিক নির্বাচন করুন</option>
                  {topics.map((topic: Topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ফাইল আপলোড করুন
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                {formData.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.files.map((file) => (
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
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {uploading ? 'আপলোড হচ্ছে...' : editingVideo ? 'আপডেট করুন' : 'যোগ করুন'}
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

      {/* YouTube Player */}
      <YouTubePlayer
        videoId={playerState.videoId}
        isOpen={playerState.isOpen}
        onClose={closePlayer}
        title={playerState.title}
      />
    </div>
  );
};

export default VideoManager;