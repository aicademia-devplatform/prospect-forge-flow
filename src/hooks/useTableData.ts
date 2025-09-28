import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseTableDataParams {
  tableName: 'apollo_contacts' | 'crm_contacts';
  page: number;
  pageSize: number;
  searchTerm: string;
  searchColumns?: string[]; // Add search columns parameter
  sectionFilter: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  visibleColumns?: string[];
  advancedFilters?: {
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    dataSection?: string | string[];
    zohoStatus?: string;
    apolloStatus?: string;
    contactActive?: string;
    industrie?: string;
    company?: string;
  };
}

interface TableDataResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useTableData = (params: UseTableDataParams) => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data with params:', params);
      
      const { data: response, error } = await supabase.functions.invoke('table-data', {
        body: params
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const result: TableDataResponse = response;
      console.log('Received data:', result);

      setData(result.data || []);
      setTotalCount(result.count || 0);
      setTotalPages(result.totalPages || 0);
      
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données.",
        duration: 4000 // 4 secondes pour les erreurs
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    params.tableName,
    params.page,
    params.pageSize,
    params.searchTerm,
    params.searchColumns,
    params.sectionFilter,
    params.sortBy,
    params.sortOrder,
    params.visibleColumns,
    params.advancedFilters
  ]);

  return {
    data,
    totalCount,
    totalPages,
    loading,
    refetch: fetchData
  };
};