import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Interfaces pour les filtres
export interface StatusFilters {
  // Filtres CRM
  zoho_status?: string[];
  apollo_status?: string[];
  data_section?: string[];
  
  // Filtres HubSpot
  lifecyclestage?: string[];
  hs_lead_status?: string[];
  hs_pipeline?: string[];
  
  // Filtres Apollo
  email_status?: string[];
  stage?: string[];
  lists?: string[];
}

export interface AdvancedFilters {
  company?: string;
  industrie?: string;
  nb_employees?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface UseUnifiedCRMDataParams {
  tableName: string;
  page: number;
  pageSize: number;
  searchTerm: string;
  searchColumns?: string[];
  sectionFilter: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  visibleColumns?: string[];
  
  // Nouveaux filtres pour la vue unifiée
  sourceFilters?: ('crm' | 'hubspot' | 'apollo')[];
  statusFilters?: StatusFilters;
  advancedFilters?: AdvancedFilters;
}

export interface UnifiedCRMDataResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useUnifiedCRMData = (params: UseUnifiedCRMDataParams) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearchTerm = useDebounce(params.searchTerm, 300);

  // Créer une clé de requête unique
  const queryKey = [
    'unified-crm-data',
    params.tableName,
    params.page,
    params.pageSize,
    debouncedSearchTerm,
    params.searchColumns,
    params.sectionFilter,
    params.sortBy,
    params.sortOrder,
    params.visibleColumns,
    params.sourceFilters,
    params.statusFilters,
    params.advancedFilters
  ];

  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<UnifiedCRMDataResponse> => {
      console.log('Fetching unified CRM data with params:', params);
      
      // Construire la requête Supabase
      let query = supabase
        .from('unified_crm_detailed_view' as any)
        .select('*', { count: 'exact' });

      // Appliquer les filtres de recherche
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        const searchLower = debouncedSearchTerm.toLowerCase().trim();
        
        if (params.searchColumns && params.searchColumns.length > 0) {
          // Recherche sur colonnes spécifiques
          const searchConditions = params.searchColumns
            .map(col => `${col}.ilike.%${searchLower}%`)
            .join(',');
          query = query.or(searchConditions);
        } else {
          // Recherche par défaut sur email, firstname, lastname, company
          query = query.or(
            `email.ilike.%${searchLower}%,firstname.ilike.%${searchLower}%,lastname.ilike.%${searchLower}%,company.ilike.%${searchLower}%`
          );
        }
      }

      // Appliquer les filtres par source
      if (params.sourceFilters && params.sourceFilters.length > 0) {
        const sourceConditions = params.sourceFilters
          .map(source => {
            if (source === 'crm') return 'has_crm.eq.true';
            if (source === 'hubspot') return 'has_hubspot.eq.true';
            if (source === 'apollo') return 'has_apollo.eq.true';
            return '';
          })
          .filter(Boolean)
          .join(',');
        
        if (sourceConditions) {
          query = query.or(sourceConditions);
        }
      }

      // Appliquer les filtres de statut CRM
      if (params.statusFilters) {
        if (params.statusFilters.zoho_status && params.statusFilters.zoho_status.length > 0) {
          query = query.in('zoho_status', params.statusFilters.zoho_status);
        }
        
        if (params.statusFilters.apollo_status && params.statusFilters.apollo_status.length > 0) {
          query = query.in('crm_apollo_status', params.statusFilters.apollo_status);
        }
        
        if (params.statusFilters.data_section && params.statusFilters.data_section.length > 0) {
          query = query.in('data_section', params.statusFilters.data_section);
        }

        // Appliquer les filtres de statut HubSpot
        if (params.statusFilters.lifecyclestage && params.statusFilters.lifecyclestage.length > 0) {
          query = query.in('lifecyclestage', params.statusFilters.lifecyclestage);
        }
        
        if (params.statusFilters.hs_lead_status && params.statusFilters.hs_lead_status.length > 0) {
          query = query.in('hs_lead_status', params.statusFilters.hs_lead_status);
        }

        // Appliquer les filtres de statut Apollo
        if (params.statusFilters.email_status && params.statusFilters.email_status.length > 0) {
          query = query.in('apollo_email_status', params.statusFilters.email_status);
        }
        
        if (params.statusFilters.stage && params.statusFilters.stage.length > 0) {
          query = query.in('apollo_stage', params.statusFilters.stage);
        }
      }

      // Appliquer les filtres avancés
      if (params.advancedFilters) {
        if (params.advancedFilters.company) {
          query = query.ilike('company', `%${params.advancedFilters.company}%`);
        }
        
        if (params.advancedFilters.industrie) {
          query = query.ilike('industrie', `%${params.advancedFilters.industrie}%`);
        }
        
        if (params.advancedFilters.nb_employees) {
          if (params.advancedFilters.nb_employees.min !== undefined) {
            query = query.gte('nb_employees', params.advancedFilters.nb_employees.min);
          }
          if (params.advancedFilters.nb_employees.max !== undefined) {
            query = query.lte('nb_employees', params.advancedFilters.nb_employees.max);
          }
        }
        
        if (params.advancedFilters.dateRange) {
          if (params.advancedFilters.dateRange.from) {
            query = query.gte('last_updated', params.advancedFilters.dateRange.from.toISOString());
          }
          if (params.advancedFilters.dateRange.to) {
            query = query.lte('last_updated', params.advancedFilters.dateRange.to.toISOString());
          }
        }
      }

      // Appliquer le tri
      const sortColumn = params.sortBy || 'last_updated';
      const sortAscending = params.sortOrder === 'asc';
      query = query.order(sortColumn, { ascending: sortAscending, nullsFirst: false });

      // Appliquer la pagination
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const result: UnifiedCRMDataResponse = {
        data: data || [],
        count: count || 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil((count || 0) / params.pageSize)
      };

      console.log('Received unified CRM data:', result);
      return result;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: 2
  });

  // Fonction pour mettre à jour une ligne dans le cache
  const updateRowInCache = (rowId: string, updates: Record<string, any>) => {
    queryClient.setQueryData(queryKey, (oldData: UnifiedCRMDataResponse | undefined) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map(row => {
          const isMatch = row.crm_id?.toString() === rowId.toString() || 
                         row.crm_id === rowId || 
                         row.crm_id === parseInt(rowId);
          
          return isMatch 
            ? { ...row, ...updates, _lastModified: new Date().toISOString() }
            : row;
        })
      };
    });
  };

  // Fonction pour effectuer une mise à jour optimiste avec synchronisation de la base de données
  const optimisticUpdate = async (rowId: string, updates: Record<string, any>) => {
    const originalData = queryClient.getQueryData(queryKey) as UnifiedCRMDataResponse | undefined;
    
    if (!originalData?.data) {
      throw new Error('No data available for update');
    }
    
    const originalRow = originalData.data.find(row => 
      row.crm_id?.toString() === rowId.toString() || 
      row.crm_id === rowId || 
      row.crm_id === parseInt(rowId)
    );
    
    if (!originalRow) {
      console.error('Row not found for update:', { rowId, availableIds: originalData.data.map(r => r.crm_id) });
      throw new Error(`Row with CRM ID ${rowId} not found for update`);
    }

    // Appliquer la mise à jour optimiste immédiatement
    updateRowInCache(rowId, updates);

    try {
      // Mettre à jour dans la table crm_contacts (source prioritaire)
      const { error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', rowId);

      if (error) throw error;

      // Rafraîchir la vue matérialisée (optionnel, peut être fait en background)
      // Pour l'instant, on laisse le refresh manuel ou automatique

      return { success: true };
    } catch (error) {
      // Rollback en cas d'erreur
      if (originalRow) {
        queryClient.setQueryData(queryKey, (oldData: UnifiedCRMDataResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map(row => {
              const isMatch = row.crm_id?.toString() === rowId.toString() || 
                             row.crm_id === rowId || 
                             row.crm_id === parseInt(rowId);
              
              return isMatch 
                ? { ...originalRow, _lastModified: undefined }
                : row;
            })
          };
        });
      }
      throw error;
    }
  };

  // Fonction pour invalider et rafraîchir les données
  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['unified-crm-data', params.tableName] });
  };

  return {
    data: (queryData as UnifiedCRMDataResponse)?.data || [],
    totalCount: (queryData as UnifiedCRMDataResponse)?.count || 0,
    totalPages: (queryData as UnifiedCRMDataResponse)?.totalPages || 0,
    loading,
    refetch,
    updateRowInCache,
    optimisticUpdate,
    invalidateAndRefetch
  };
};


