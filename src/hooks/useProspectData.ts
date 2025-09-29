import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseProspectDataParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  searchColumns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  visibleColumns?: string[];
  statusFilter?: string;
  sourceFilter?: string;
}

interface ProspectDataResponse {
  data: any[];
  count: number;
  totalPages: number;
}

export const useProspectData = (params: UseProspectDataParams) => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get all assignments for the current user
      let assignmentsQuery = supabase
        .from('sales_assignments')
        .select('*')
        .eq('sales_user_id', user.id)
        .eq('status', 'active');

      const { data: assignments, error: assignError } = await assignmentsQuery;
      if (assignError) throw assignError;

      let allProspects: any[] = [];

      // Fetch data from each source table
      for (const assignment of assignments || []) {
        let prospectData: any = null;
        
        if (assignment.source_table === 'apollo_contacts') {
          const { data } = await supabase
            .from('apollo_contacts')
            .select('*')
            .eq('id', assignment.source_id)
            .maybeSingle();
          prospectData = data;
        } else if (assignment.source_table === 'crm_contacts') {
          const { data } = await supabase
            .from('crm_contacts')
            .select('*')
            .eq('id', parseInt(assignment.source_id))
            .maybeSingle();
          prospectData = data;
        }

        if (prospectData) {
          // Normalize data structure
          const normalizedProspect = {
            id: assignment.id,
            assignment_id: assignment.id,
            source_id: assignment.source_id,
            source_table: assignment.source_table,
            custom_table_name: assignment.custom_table_name,
            assigned_at: assignment.assigned_at,
            email: prospectData.email,
            name: prospectData.first_name && prospectData.last_name 
              ? `${prospectData.first_name} ${prospectData.last_name}`
              : prospectData.firstname && prospectData.name
              ? `${prospectData.firstname} ${prospectData.name}`
              : prospectData.name || prospectData.email,
            first_name: prospectData.first_name || prospectData.firstname || '',
            last_name: prospectData.last_name || prospectData.name || '',
            company: prospectData.company || '',
            title: prospectData.title || prospectData.linkedin_function || '',
            phone: prospectData.mobile_phone || prospectData.work_direct_phone || prospectData.mobile || prospectData.tel || '',
            status: prospectData.apollo_status || prospectData.zoho_status || 'new',
            source: assignment.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM',
            industry: prospectData.industry || prospectData.industrie || '',
            seniority: prospectData.seniority || '',
            departments: prospectData.departments || '',
            stage: prospectData.stage || '',
            nb_employees: prospectData.nb_employees || prospectData.num_employees || '',
            linkedin_url: prospectData.person_linkedin_url || prospectData.linkedin_url || '',
            website: prospectData.website || prospectData.company_website || '',
            last_contacted: prospectData.last_contacted || prospectData.created_at,
            created_at: prospectData.created_at,
            updated_at: prospectData.updated_at,
            // Include original data for reference
            _original_data: prospectData
          };

          allProspects.push(normalizedProspect);
        }
      }

      // Apply filters
      let filteredProspects = allProspects;

      // Search filter
      if (params.searchTerm && params.searchTerm.trim()) {
        const searchTerm = params.searchTerm.toLowerCase();
        const searchColumns = params.searchColumns || ['name', 'email', 'company'];
        
        filteredProspects = filteredProspects.filter(prospect => 
          searchColumns.some(column => 
            prospect[column]?.toString().toLowerCase().includes(searchTerm)
          )
        );
      }

      // Status filter
      if (params.statusFilter && params.statusFilter !== 'all') {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.status === params.statusFilter
        );
      }

      // Source filter
      if (params.sourceFilter && params.sourceFilter !== 'all') {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.source === params.sourceFilter
        );
      }

      // Sort
      if (params.sortBy) {
        filteredProspects.sort((a, b) => {
          const aVal = a[params.sortBy!] || '';
          const bVal = b[params.sortBy!] || '';
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;
          
          return params.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Pagination
      const totalCount = filteredProspects.length;
      const totalPages = Math.ceil(totalCount / params.pageSize);
      const startIndex = (params.page - 1) * params.pageSize;
      const endIndex = startIndex + params.pageSize;
      const paginatedData = filteredProspects.slice(startIndex, endIndex);

      setData(paginatedData);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Error fetching prospect data:', error);
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
    user?.id,
    params.page,
    params.pageSize,
    params.searchTerm,
    params.sortBy,
    params.sortOrder,
    params.statusFilter,
    params.sourceFilter,
    JSON.stringify(params.searchColumns)
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