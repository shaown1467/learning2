import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where,
  DocumentData,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirestore = (collectionName: string, orderByField?: string, whereClause?: { field: string; operator: any; value: any }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    let q = collection(db, collectionName);
    
    if (whereClause) {
      q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
    }
    
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(doc => ({
          const data = doc.data();
          
          // Convert Firestore Timestamps to JavaScript Dates
          const convertedData = Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            if (value instanceof Timestamp) {
              acc[key] = value.toDate();
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any);
          
          return {
            id: doc.id,
            ...convertedData,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt || new Date())
          };
        });
        )
        setDocuments(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, orderByField, whereClause?.field, whereClause?.operator, whereClause?.value]);

  const addDocument = async (data: any) => {
    try {
      // Convert JavaScript Dates to Firestore Timestamps
      const convertedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key];
        if (value instanceof Date) {
          acc[key] = Timestamp.fromDate(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...convertedData,
        createdAt: Timestamp.fromDate(new Date())
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id: string, data: any) => {
    try {
      // Convert JavaScript Dates to Firestore Timestamps
      const convertedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key];
        if (value instanceof Date) {
          acc[key] = Timestamp.fromDate(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      await updateDoc(doc(db, collectionName, id), convertedData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
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
    deleteDocument
  };
};