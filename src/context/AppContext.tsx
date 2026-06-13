import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SetPiece } from '../types';
import { supabase } from '../lib/supabase';

type AppContextType = {
  localSetPieces: SetPiece[];
  supabaseSetPieces: SetPiece[];
  addLocalSetPiece: (setPiece: SetPiece) => Promise<void>;
  deleteSetPiece: (id: string) => Promise<void>;
  updateSetPiece: (id: string, setPiece: Partial<SetPiece>) => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
};

const defaultContext: AppContextType = {
  localSetPieces: [],
  supabaseSetPieces: [],
  addLocalSetPiece: async () => {},
  deleteSetPiece: async () => {},
  updateSetPiece: async () => {},
  activeTab: 'dashboard',
  setActiveTab: () => {},
  loading: true,
};

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localSetPieces, setLocalSetPieces] = useState<SetPiece[]>([]);
  const [supabaseSetPieces, setSupabaseSetPieces] = useState<SetPiece[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const fetchSetPieces = async () => {
    try {
      const { data, error } = await supabase
        .from('set_pieces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSupabaseSetPieces(data || []);
    } catch (error) {
      console.error('Error fetching set pieces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetPieces();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('set_pieces_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'set_pieces'
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          
          if (!payload) return;

          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new?.id) {
                const { data: newData, error: insertError } = await supabase
                  .from('set_pieces')
                  .select('*')
                  .eq('id', payload.new.id)
                  .single();
                  
                if (!insertError && newData) {
                  setSupabaseSetPieces(prev => [newData, ...prev]);
                }
              }
              break;

            case 'UPDATE':
              if (payload.new?.id) {
                const { data: updatedData, error: updateError } = await supabase
                  .from('set_pieces')
                  .select('*')
                  .eq('id', payload.new.id)
                  .single();
                  
                if (!updateError && updatedData) {
                  setSupabaseSetPieces(prev =>
                    prev.map(piece => (piece && piece.id === updatedData.id) ? updatedData : piece)
                  );
                }
              }
              break;

            case 'DELETE':
              if (payload.old?.id) {
                setSupabaseSetPieces(prev =>
                  prev.filter(piece => piece && piece.id !== payload.old.id)
                );
              }
              break;

            default:
              await fetchSetPieces();
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addLocalSetPiece = async (setPiece: SetPiece) => {
    try {
      const { data, error } = await supabase
        .from('set_pieces')
        .insert([setPiece])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setLocalSetPieces(prev => [data[0], ...prev]);
        setSupabaseSetPieces(prev => [data[0], ...prev]);
      }
    } catch (error) {
      console.error('Error adding set piece:', error);
      throw error;
    }
  };

  const deleteSetPiece = async (id: string) => {
    try {
      const { error } = await supabase
        .from('set_pieces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocalSetPieces(prev => prev.filter(piece => piece && piece.id !== id));
      setSupabaseSetPieces(prev => prev.filter(piece => piece && piece.id !== id));
    } catch (error: any) {
      console.error('Error deleting set piece:', error);
      throw new Error(error.message || 'Failed to delete set piece');
    }
  };

  const updateSetPiece = async (id: string, setPiece: Partial<SetPiece>) => {
    try {
      const { data, error } = await supabase
        .from('set_pieces')
        .update(setPiece)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setLocalSetPieces(prev => 
          prev.map(piece => (piece && piece.id === id) ? data[0] : piece)
        );
        setSupabaseSetPieces(prev => 
          prev.map(piece => (piece && piece.id === id) ? data[0] : piece)
        );
      }
    } catch (error: any) {
      console.error('Error updating set piece:', error);
      throw new Error(error.message || 'Failed to update set piece');
    }
  };

  return (
    <AppContext.Provider
      value={{
        localSetPieces,
        supabaseSetPieces,
        addLocalSetPiece,
        deleteSetPiece,
        updateSetPiece,
        activeTab,
        setActiveTab,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};