import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAssignedProspectsDataParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  searchColumns?: string[];
  sectionFilter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  visibleColumns?: string[];
  advancedFilters?: Record<string, any>;
  salesFilters?: Record<string, any>;
  filterMode?: 'assigned' | 'traites' | 'rappeler';
}

interface AssignedProspectsDataResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useAssignedProspectsData = (params: UseAssignedProspectsDataParams) => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('assigned-prospects', {
        body: {
          page: params.page,
          pageSize: params.pageSize,
          searchTerm: params.searchTerm,
          searchColumns: params.searchColumns,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          visibleColumns: params.visibleColumns,
          advancedFilters: params.advancedFilters,
          salesFilters: params.salesFilters,
          filterMode: params.filterMode
        }
      });

      if (error) {
        console.error('Error fetching assigned prospects:', error);
        throw error;
      }

      setData(response?.data || []);
      setTotalCount(response?.count || 0);
      setTotalPages(response?.totalPages || 0);
    } catch (error) {
      console.error('Error in useAssignedProspectsData:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    params.page,
    params.pageSize,
    params.searchTerm,
    params.sortBy,
    params.sortOrder,
    params.sectionFilter,
    params.filterMode,
    JSON.stringify(params.searchColumns),
    JSON.stringify(params.visibleColumns),
    JSON.stringify(params.advancedFilters),
    JSON.stringify(params.salesFilters)
  ]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};