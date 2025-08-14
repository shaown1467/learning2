import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useSupabase = (
  table: string, 
  orderBy?: string, 
  ascending: boolean = true,
  filters?: { column: string; operator: string; value: any }[]
) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    fetchData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, orderBy, ascending, currentUser, JSON.stringify(filters)]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select('*');
      
      // Apply filters
      if (filters) {
        filters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setDocuments(data || []);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${table}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (data: any) => {
    try {
      const { data: newDoc, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newDoc.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchData
  };
};