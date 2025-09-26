import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const uploadFile = async (file: File, folder: string = 'general'): Promise<string> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${user.id}/${Date.now()}.${fileExt}`;
    
    // Check if bucket exists before uploading
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      throw new Error('Storage service unavailable');
    }
    
    const uploadsExists = buckets.some(bucket => bucket.name === 'uploads');
    if (!uploadsExists) {
      throw new Error('Storage bucket "uploads" not found. Please create it in Supabase Dashboard.');
    }
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);
    
    console.log('File uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('File upload error:', error);
    
    // More specific error messages
    if (error?.message?.includes('not authenticated')) {
      toast.error('ফাইল আপলোড করার অনুমতি নেই। অনুগ্রহ করে লগইন করুন।');
    } else if (error?.message?.includes('bucket') || error?.message?.includes('Bucket not found')) {
      toast.error('স্টোরেজ বাকেট পাওয়া যায়নি। Supabase Dashboard এ "uploads" বাকেট তৈরি করুন।');
    } else if (error?.message?.includes('quota')) {
      toast.error('স্টোরেজ সীমা অতিক্রম করেছে।');
    } else if (error?.message?.includes('format')) {
      toast.error('অবৈধ ফাইল ফরম্যাট।');
    } else {
      toast.error(`ফাইল আপলোড এরর: ${error?.message || 'অজানা সমস্যা'}`);
    }
    throw error;
  }
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to delete files');
    }

    // Extract file path from URL
    const urlParts = url.split('/uploads/');
    if (urlParts.length < 2) return;
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) throw error;
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