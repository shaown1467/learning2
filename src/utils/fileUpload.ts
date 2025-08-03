import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Check if user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload files');
    }

    // Simplified file path without user ID to avoid CORS issues
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileRef = ref(storage, `${path}/${fileName}`);
    
    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: auth.currentUser.uid,
        originalName: file.name
      }
    };
    
    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('File uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('File upload error:', error);
    
    // More specific error messages
    if (error?.code === 'storage/unauthorized') {
      toast.error('ফাইল আপলোড করার অনুমতি নেই। অনুগ্রহ করে লগইন করুন।');
    } else if (error?.code === 'storage/quota-exceeded') {
      toast.error('স্টোরেজ সীমা অতিক্রম করেছে।');
    } else if (error?.code === 'storage/invalid-format') {
      toast.error('অবৈধ ফাইল ফরম্যাট।');
    } else if (error?.code === 'storage/unknown') {
      toast.error('Firebase Storage এ সমস্যা। Rules চেক করুন।');
    } else {
      toast.error(`ফাইল আপলোড এরর: ${error?.message || 'অজানা সমস্যা'}`);
    }
    throw error;
  }
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Check if user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete files');
    }

    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('File delete error:', error);
    toast.error('ফাইল ডিলিট করতে সমস্যা হয়েছে।');
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('audio')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('document') || type.includes('word')) return '📝';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📋';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  return '📁';
};