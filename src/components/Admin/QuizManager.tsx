import React, { useState } from 'react';
import { Plus, Edit, Trash2, HelpCircle, Award, CheckCircle, Eye } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Quiz, Question, Video, Topic, UserProgress } from '../../types';
import toast from 'react-hot-toast';

const QuizManager: React.FC = () => {
  const { documents: quizzes, addDocument, updateDocument, deleteDocument } = useSupabase('quizzes', 'created_at', false);
  const { documents: videos } = useSupabase('videos', 'order');
  const { documents: topics } = useSupabase('topics', 'order');
  const { documents: userProgress } = useSupabase('user_progress', 'submitted_at', false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    videoId: '',
    questions: [] as Question[],
    passingScore: 70,
    points: 10
  });

  const resetForm = () => {
    setFormData({
      videoId: '',
      questions: [],
      passingScore: 70,
      points: 10
    });
    setEditingQuiz(null);
  };

  const openModal = (quiz?: Quiz) => {
    if (quiz) {
      setFormData({
        videoId: quiz.videoId,
        questions: quiz.questions,
        passingScore: quiz.passingScore,
        points: quiz.points
      });
      setEditingQuiz(quiz);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.questions.length === 0) {
      toast.error('অন্তত একটি প্রশ্ন যোগ করুন!');
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question.trim()) {
        toast.error(`প্রশ্ন ${i + 1} এর জন্য প্রশ্ন লিখুন!`);
        return;
      }
      if (question.options.some(option => !option.trim())) {
        toast.error(`প্রশ্ন ${i + 1} এর সব অপশন পূরণ করুন!`);
        return;
      }
    }

    try {
      if (editingQuiz) {
        await updateDocument(editingQuiz.id, formData);
        toast.success('কুইজ আপডেট হয়েছে!');
      } else {
        await addDocument(formData);
        toast.success('নতুন কুইজ যোগ করা হয়েছে!');
      }
      closeModal();
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই কুইজটি মুছে ফেলতে চান?')) {
      try {
        await deleteDocument(id);
        toast.success('কুইজ মুছে ফেলা হয়েছে!');
      } catch (error) {
        toast.error('মুছে ফেলতে সমস্যা হয়েছে!');
      }
    }
  };

  const getVideoTitle = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    return video ? video.title : 'অজানা ভিডিও';
  };

  const getTopicName = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    if (!video) return 'অজানা টপিক';
    const topic = topics.find((t: Topic) => t.id === video.topicId);
    return topic ? topic.name : 'অজানা টপিক';
  };

  const getQuizResults = (quizId: string) => {
    return userProgress.filter((progress: UserProgress) => 
      progress.videoId === quizzes.find((q: Quiz) => q.id === quizId)?.videoId && 
      progress.quizScore !== undefined
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">কুইজ ম্যানেজমেন্ট</h2>
          <p className="text-gray-600">ভিডিওর জন্য কুইজ তৈরি এবং পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন কুইজ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz: Quiz) => {
          const results = getQuizResults(quiz.id);
          const averageScore = results.length > 0 
            ? results.reduce((sum, r) => sum + (r.quizScore || 0), 0) / results.length 
            : 0;

          return (
            <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">কুইজ</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingResults(viewingResults === quiz.id ? null : quiz.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="ফলাফল দেখুন"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(quiz)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">{getVideoTitle(quiz.videoId)}</h3>
                <p className="text-sm text-blue-600">{getTopicName(quiz.videoId)}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{quiz.questions.length} টি প্রশ্ন</span>
                  <span>পাসিং: {quiz.passingScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">{quiz.points} পয়েন্ট</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.length} জন অংশগ্রহণ
                  </div>
                </div>
                {results.length > 0 && (
                  <div className="text-sm text-green-600">
                    গড় স্কোর: {averageScore.toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Quiz Results */}
              {viewingResults === quiz.id && results.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">কুইজের ফলাফল</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.map((result: UserProgress) => (
                      <div key={result.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">ব্যবহারকারী</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            (result.quizScore || 0) >= quiz.passingScore 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {result.quizScore}%
                          </span>
                          {(result.quizScore || 0) >= quiz.passingScore && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">কোন কুইজ নেই</p>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingQuiz ? 'কুইজ এডিট করুন' : 'নতুন কুইজ তৈরি করুন'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ভিডিও নির্বাচন করুন
                  </label>
                  <select
                    required
                    value={formData.videoId}
                    onChange={(e) => setFormData({ ...formData, videoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ভিডিও নির্বাচন করুন</option>
                    {videos.map((video: Video) => (
                      <option key={video.id} value={video.id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    পাসিং স্কোর (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    পয়েন্ট
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">প্রশ্নসমূহ</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>প্রশ্ন যোগ করুন</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {formData.questions.map((question, questionIndex) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">প্রশ্ন {questionIndex + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="প্রশ্ন লিখুন..."
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${questionIndex}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                                className="text-blue-600"
                              />
                              <input
                                type="text"
                                placeholder={`অপশন ${optionIndex + 1}`}
                                value={option}
                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingQuiz ? 'আপডেট করুন' : 'কুইজ তৈরি করুন'}
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

export default QuizManager;