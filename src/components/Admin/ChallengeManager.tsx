import React, { useState } from 'react';
import { Plus, Edit, Trash2, Trophy, Calendar, Users, CreditCard, Check, X, RefreshCw } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { Challenge, ChallengeSubmission, ChallengePayment } from '../../types';
import toast from 'react-hot-toast';

const ChallengeManager: React.FC = () => {
  const { documents: challenges, addDocument: addChallenge, updateDocument: updateChallenge, deleteDocument: deleteChallenge } = useSupabase('challenges', 'created_at', false);
  const { documents: submissions, updateDocument: updateSubmission, deleteDocument: deleteSubmission } = useSupabase('challenge_submissions', 'created_at', false);
  const { documents: payments, updateDocument: updatePayment } = useSupabase('challenge_payments', 'created_at', false);
  
  const [activeTab, setActiveTab] = useState('challenges');
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeForm, setChallengeForm] = useState({
    type: '7day' as '7day' | '30day',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    price: 0,
    paymentNumber: ''
  });

  const resetChallengeForm = () => {
    setChallengeForm({
      type: '7day',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      price: 0,
      paymentNumber: ''
    });
    setEditingChallenge(null);
  };

  const openChallengeModal = (challenge?: Challenge) => {
    if (challenge) {
      setChallengeForm({
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        startDate: new Date(challenge.startDate).toISOString().split('T')[0],
        endDate: new Date(challenge.endDate).toISOString().split('T')[0],
        price: challenge.price,
        paymentNumber: challenge.paymentNumber || ''
      });
      setEditingChallenge(challenge);
    } else {
      resetChallengeForm();
    }
    setIsChallengeModalOpen(true);
  };

  const closeChallengeModal = () => {
    setIsChallengeModalOpen(false);
    resetChallengeForm();
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const challengeData = {
        ...challengeForm,
        start_date: new Date(challengeForm.startDate),
        end_date: new Date(challengeForm.endDate),
        is_active: true
      };

      if (editingChallenge) {
        await updateChallenge(editingChallenge.id, challengeData);
        toast.success('চ্যালেঞ্জ আপডেট হয়েছে!');
      } else {
        // Deactivate other challenges of the same type
        const existingChallenges = challenges.filter((c: Challenge) => c.type === challengeForm.type && c.is_active);
        for (const challenge of existingChallenges) {
          await updateChallenge(challenge.id, { is_active: false });
        }
        
        await addChallenge(challengeData);
        toast.success('নতুন চ্যালেঞ্জ তৈরি হয়েছে!');
      }
      closeChallengeModal();
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই চ্যালেঞ্জটি মুছে ফেলতে চান?')) {
      try {
        await deleteChallenge(id);
        toast.success('চ্যালেঞ্জ মুছে ফেলা হয়েছে!');
      } catch (error) {
        toast.error('মুছে ফেলতে সমস্যা হয়েছে!');
      }
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await updateSubmission(submissionId, { approved: true });
      toast.success('প্রজেক্ট অনুমোদিত হয়েছে!');
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই প্রজেক্টটি প্রত্যাখ্যান করতে চান?')) {
      try {
        await deleteSubmission(submissionId);
        toast.success('প্রজেক্ট প্রত্যাখ্যান করা হয়েছে!');
      } catch (error) {
        toast.error('সমস্যা হয়েছে!');
      }
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await updatePayment(paymentId, { status: 'approved' });
      toast.success('পেমেন্ট অনুমোদিত হয়েছে!');
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      await updatePayment(paymentId, { status: 'rejected' });
      toast.success('পেমেন্ট প্রত্যাখ্যান করা হয়েছে!');
    } catch (error) {
      toast.error('সমস্যা হয়েছে!');
    }
  };

  const handleResetChallenge = async (challengeId: string, type: '7day' | '30day') => {
    if (window.confirm(`আপনি কি নিশ্চিত যে ${type === '7day' ? '৭ দিনের' : '৩০ দিনের'} চ্যালেঞ্জ রিসেট করতে চান? সব সাবমিশন মুছে যাবে।`)) {
      try {
        // Delete all submissions for this challenge
        const challengeSubmissions = submissions.filter((s: ChallengeSubmission) => s.challenge_id === challengeId);
        for (const submission of challengeSubmissions) {
          await deleteSubmission(submission.id);
        }
        
        // Deactivate the challenge
        await updateChallenge(challengeId, { is_active: false });
        
        toast.success('চ্যালেঞ্জ রিসেট হয়েছে!');
      } catch (error) {
        toast.error('রিসেট করতে সমস্যা হয়েছে!');
      }
    }
  };

  const pendingSubmissions = submissions.filter((s: ChallengeSubmission) => !s.approved);
  const pendingPayments = payments.filter((p: ChallengePayment) => p.status === 'pending');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">চ্যালেঞ্জ ম্যানেজমেন্ট</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'challenges', label: 'চ্যালেঞ্জ তালিকা' },
            { id: 'submissions', label: `অপেক্ষমাণ প্রজেক্ট (${pendingSubmissions.length})` },
            { id: 'payments', label: `অপেক্ষমাণ পেমেন্ট (${pendingPayments.length})` },
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

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">চ্যালেঞ্জ তালিকা</h3>
            <button
              onClick={() => openChallengeModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন চ্যালেঞ্জ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge: Challenge) => {
              const challengeSubmissions = submissions.filter((s: ChallengeSubmission) => s.challenge_id === challenge.id);
              
              return (
                <div key={challenge.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Trophy className={`h-6 w-6 ${challenge.type === '7day' ? 'text-purple-600' : 'text-orange-600'}`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          challenge.type === '7day' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {challenge.type === '7day' ? '৭ দিনের চ্যালেঞ্জ' : '৩০ দিনের চ্যালেঞ্জ'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {challenge.isActive && (
                        <button
                          onClick={() => handleResetChallenge(challenge.id, challenge.type)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="চ্যালেঞ্জ রিসেট করুন"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openChallengeModal(challenge)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{challenge.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(challenge.start_date).toLocaleDateString('bn-BD')} - {new Date(challenge.end_date).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{challengeSubmissions.length} জন অংশগ্রহণকারী</span>
                    </div>
                    {challenge.price > 0 && (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>৳{challenge.price}</span>
                      </div>
                    )}
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      challenge.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {challenge.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Submissions Tab */}
      {activeTab === 'submissions' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">অপেক্ষমাণ প্রজেক্ট</h3>
          <div className="space-y-4">
            {pendingSubmissions.map((submission: ChallengeSubmission) => (
              <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{submission.title}</h4>
                    <p className="text-sm text-gray-600">
                      {submission.author_name} • {submission.challenge_type === '7day' ? '৭ দিনের চ্যালেঞ্জ' : '৩০ দিনের চ্যালেঞ্জ'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveSubmission(submission.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="অনুমোদন করুন"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRejectSubmission(submission.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="প্রত্যাখ্যান করুন"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{submission.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <a
                    href={submission.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ইউটিউব ভিডিও দেখুন
                  </a>
                  {submission.files && submission.files.length > 0 && (
                    <span>{submission.files.length} টি ফাইল</span>
                  )}
                </div>
              </div>
            ))}
            
            {pendingSubmissions.length === 0 && (
              <p className="text-gray-500 text-center py-8">কোন অপেক্ষমাণ প্রজেক্ট নেই</p>
            )}
          </div>
        </div>
      )}

      {/* Pending Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">অপেক্ষমাণ পেমেন্ট</h3>
          <div className="space-y-4">
            {pendingPayments.map((payment: ChallengePayment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{payment.user_name}</h4>
                    <p className="text-sm text-gray-600">{payment.user_email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprovePayment(payment.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="অনুমোদন করুন"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRejectPayment(payment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="প্রত্যাখ্যান করুন"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">পেমেন্ট নম্বর:</span>
                    <p className="font-medium">{payment.payment_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ট্রানজেকশন আইডি:</span>
                    <p className="font-medium">{payment.transaction_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">পরিমাণ:</span>
                    <p className="font-medium">৳{payment.amount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">তারিখ:</span>
                    <p className="font-medium">{new Date(payment.created_at).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingPayments.length === 0 && (
              <p className="text-gray-500 text-center py-8">কোন অপেক্ষমাণ পেমেন্ট নেই</p>
            )}
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingChallenge ? 'চ্যালেঞ্জ এডিট করুন' : 'নতুন চ্যালেঞ্জ তৈরি করুন'}
            </h3>
            
            <form onSubmit={handleChallengeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  চ্যালেঞ্জের ধরন
                </label>
                <select
                  value={challengeForm.type}
                  onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value as '7day' | '30day' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7day">৭ দিনের চ্যালেঞ্জ</option>
                  <option value="30day">৩০ দিনের চ্যালেঞ্জ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={challengeForm.title}
                  onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="চ্যালেঞ্জের শিরোনাম"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বিবরণ
                </label>
                <textarea
                  value={challengeForm.description}
                  onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="চ্যালেঞ্জের বিবরণ"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={challengeForm.startDate}
                    onChange={(e) => setChallengeForm({ ...challengeForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    শেষের তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={challengeForm.endDate}
                    onChange={(e) => setChallengeForm({ ...challengeForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {challengeForm.type === '30day' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      মূল্য (টাকা) - ০ দিলে ফ্রি হবে
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={challengeForm.price}
                      onChange={(e) => setChallengeForm({ ...challengeForm, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {challengeForm.price > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        পেমেন্ট নম্বর (বিকাশ/নগদ)
                      </label>
                      <input
                        type="text"
                        value={challengeForm.paymentNumber}
                        onChange={(e) => setChallengeForm({ ...challengeForm, paymentNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingChallenge ? 'আপডেট করুন' : 'তৈরি করুন'}
                </button>
                <button
                  type="button"
                  onClick={closeChallengeModal}
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

export default ChallengeManager;