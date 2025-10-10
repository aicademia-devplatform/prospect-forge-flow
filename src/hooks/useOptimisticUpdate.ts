import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdateOptions {
  tableName: string;
  queryKey: string[];
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useOptimisticUpdate = ({ tableName, queryKey, onSuccess, onError }: OptimisticUpdateOptions) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateRow = useCallback(async (
    rowId: string, 
    updates: Record<string, any>,
    originalData?: Record<string, any>
  ) => {
    setIsUpdating(true);
    const cellKey = `${rowId}-${Object.keys(updates)[0]}`;
    
    // Add visual feedback immediately
    setRecentlyUpdated(prev => new Set([...prev, cellKey]));

    // Optimistic update - update React Query cache immediately
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((row: any) => 
          row.id === rowId 
            ? { ...row, ...updates, _lastModified: new Date().toISOString() }
            : row
        )
      };
    });

    try {
      // Update in database
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', rowId);

      if (error) throw error;

      // Success - show success feedback
      toast({
        title: "Modification sauvegardée",
        description: "La modification a été enregistrée avec succès.",
        duration: 2000
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error updating row:', error);

      // Revert optimistic update on error
      if (originalData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((row: any) => 
              row.id === rowId 
                ? { ...row, ...originalData, _lastModified: undefined }
                : row
            )
          };
        });
      }

      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la modification.",
        duration: 4000
      });

      onError?.(error);
    } finally {
      setIsUpdating(false);
      
      // Remove visual feedback after 2 seconds
      setTimeout(() => {
        setRecentlyUpdated(prev => {
          const updated = new Set(prev);
          updated.delete(cellKey);
          return updated;
        });
      }, 2000);
    }
  }, [tableName, queryKey, queryClient, toast, onSuccess, onError]);

  const clearVisualFeedback = useCallback((cellKey: string) => {
    setRecentlyUpdated(prev => {
      const updated = new Set(prev);
      updated.delete(cellKey);
      return updated;
    });
  }, []);

  return {
    updateRow,
    isUpdating,
    recentlyUpdated,
    clearVisualFeedback
  };
};
