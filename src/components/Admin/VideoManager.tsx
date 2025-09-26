import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Play, FileText } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { uploadFile } from '../../utils/fileUpload';

interface Topic {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  order?: number;
  created_at?: string;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  video_id: string;
  topic_id?: string;
  order?: number;
  files?: any[];
  created_at?: string;
}

interface VideoFile {
  name: string;
  url: string;
  type: string;
}

export const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    topic_id: '',
    order: 0,
    files: [] as VideoFile[]
  });

  const { data: videosData, loading: videosLoading, error: videosError } = useSupabase('videos', 'created_at', null);
  const { data: topicsData, loading: topicsLoading } = useSupabase('topics', 'order', null);

  useEffect(() => {
    if (videosData) {
      setVideos(videosData);
    }
  }, [videosData]);

  useEffect(() => {
    if (topicsData) {
      setTopics(topicsData);
    }
  }, [topicsData]);

  const extractVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const videoId = extractVideoId(formData.youtube_url);
      if (!videoId) {
        alert('অবৈধ YouTube URL');
        return;
      }

      const videoData = {
        title: formData.title,
        description: formData.description,
        youtube_url: formData.youtube_url,
        video_id: videoId,
        topic_id: formData.topic_id || null,
        order: formData.order,
        files: formData.files
      };

      if (editingVideo) {
        const { error } = await window.supabase
          .from('videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
      } else {
        const { error } = await window.supabase
          .from('videos')
          .insert([videoData]);

        if (error) throw error;
      }

      // Refresh videos list
      const { data: updatedVideos } = await window.supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedVideos) {
        setVideos(updatedVideos);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Video save error:', error);
      alert('ভিডিও সেভ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadFile(file, 'videos'));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const newFiles = uploadedFiles.map((url, index) => ({
        name: files[index].name,
        url,
        type: files[index].type
      }));

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    } catch (error) {
      console.error('File upload error:', error);
      alert('ফাইল আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      youtube_url: video.youtube_url,
      topic_id: video.topic_id || '',
      order: video.order || 0,
      files: video.files || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ভিডিওটি মুছে ফেলতে চান?')) return;

    try {
      const { error } = await window.supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVideos(videos.filter(video => video.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('ভিডিও মুছতে সমস্যা হয়েছে');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      topic_id: '',
      order: 0,
      files: []
    });
    setEditingVideo(null);
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : 'কোন টপিক নেই';
  };

  if (videosLoading || topicsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ভিডিও ম্যানেজমেন্ট</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          নতুন ভিডিও
        </button>
      </div>

      {videosError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          ভিডিও লোড করতে সমস্যা হয়েছে: {videosError.message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ভিডিও
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                টপিক
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ক্রম
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ফাইল
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                অ্যাকশন
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-24">
                      <img
                        className="h-16 w-24 rounded object-cover"
                        src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                        alt={video.title}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {video.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {video.description?.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getTopicName(video.topic_id || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {video.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {video.files?.length || 0} টি ফাইল
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(video.youtube_url, '_blank')}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(video)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingVideo ? 'ভিডিও সম্পাদনা' : 'নতুন ভিডিও যোগ'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ভিডিও শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  বিবরণ
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  টপিক
                </label>
                <select
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">টপিক নির্বাচন করুন</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ক্রম
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ফাইল আপলোড
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingFiles ? 'আপলোড হচ্ছে...' : 'ফাইল নির্বাচন করুন'}
                    </span>
                  </label>
                </div>

                {formData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">আপলোড করা ফাইল:</h4>
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingFiles}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'সেভ হচ্ছে...' : editingVideo ? 'আপডেট' : 'সেভ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};