import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface UnifiedProspect {
  email: string;
  // Champs priorisés (CRM > HubSpot > Apollo)
  firstname: string | null;
  lastname: string | null;
  name: string | null;
  company: string | null;
  mobile: string | null;
  tel: string | null;
  tel_pro: string | null;
  address: string | null;
  city: string | null;
  departement: string | null;
  country: string | null;
  linkedin_url: string | null;
  linkedin_company_url: string | null;
  company_website: string | null;
  industrie: string | null;
  nb_employees: number | null;
  title: string | null;
  
  // Métadonnées
  sources: {
    crm: boolean;
    hubspot: boolean;
    apollo: boolean;
  };
  sourceData: {
    crm?: any;
    hubspot?: any;
    apollo?: any;
  };
  lastUpdated: string;
  sourceCount: number; // Nombre de sources avec données
}

interface UseUnifiedProspectsParams {
  searchTerm?: string;
  sourceFilter?: ('crm' | 'hubspot' | 'apollo')[];
  page?: number;
  pageSize?: number;
}

interface UseUnifiedProspectsReturn {
  data: UnifiedProspect[];
  loading: boolean;
  error: any;
  totalCount: number;
  totalPages: number;
  uniqueEmails: number;
  multiSourceCount: number;
  refetch: () => void;
}

export const useUnifiedProspects = (params: UseUnifiedProspectsParams = {}): UseUnifiedProspectsReturn => {
  const {
    searchTerm = '',
    sourceFilter = [],
    page = 1,
    pageSize = 25,
  } = params;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Utiliser la vue SQL unifiée pour de meilleures performances
  const { data: viewData, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['unified_prospects_view', debouncedSearchTerm, sourceFilter, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('unified_prospects_view' as any)
        .select('*', { count: 'exact' });

      // Appliquer les filtres de recherche
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        query = query.or(`email.ilike.%${searchLower}%,firstname.ilike.%${searchLower}%,lastname.ilike.%${searchLower}%,company.ilike.%${searchLower}%`);
      }

      // Appliquer les filtres de source
      if (sourceFilter.length > 0) {
        const sourceConditions = sourceFilter.map(source => {
          if (source === 'crm') return 'has_crm.eq.true';
          if (source === 'hubspot') return 'has_hubspot.eq.true';
          if (source === 'apollo') return 'has_apollo.eq.true';
          return '';
        }).filter(Boolean).join(',');
        
        if (sourceConditions) {
          query = query.or(sourceConditions);
        }
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Tri
      query = query.order('last_updated', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erreur lors de la récupération des données unifiées:', error);
        throw error;
      }

      return { data: data || [], count: count || 0 };
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  // Récupérer les statistiques globales (sans pagination)
  const { data: statsData } = useQuery({
    queryKey: ['unified_prospects_stats'],
    queryFn: async () => {
      // Compter tous les emails uniques
      const { count: totalCount } = await supabase
        .from('unified_prospects_view' as any)
        .select('*', { count: 'exact', head: true });

      // Compter les multi-sources
      const { count: multiSourceCount } = await supabase
        .from('unified_prospects_view' as any)
        .select('*', { count: 'exact', head: true })
        .gt('source_count', 1);

      return {
        uniqueEmails: totalCount || 0,
        multiSourceCount: multiSourceCount || 0
      };
    },
    staleTime: 300000, // 5 minutes pour les stats
    gcTime: 600000, // 10 minutes
  });

  // Transformer les données de la vue en format UnifiedProspect
  const unifiedData = useMemo(() => {
    if (!viewData?.data) return [];

    return viewData.data.map((row: any) => ({
      email: row.email,
      firstname: row.firstname,
      lastname: row.lastname,
      name: row.lastname, // Utiliser lastname comme name
      company: row.company,
      mobile: row.mobile,
      tel: row.tel,
      tel_pro: row.tel_pro,
      address: row.address,
      city: row.city,
      departement: row.departement,
      country: row.country,
      linkedin_url: row.linkedin_url,
      linkedin_company_url: row.linkedin_company_url,
      company_website: row.company_website,
      industrie: row.industrie,
      nb_employees: row.nb_employees,
      title: row.title,
      sources: {
        crm: row.has_crm || false,
        hubspot: row.has_hubspot || false,
        apollo: row.has_apollo || false,
      },
      sourceData: {
        // Les données brutes ne sont pas disponibles dans la vue
        // Il faudrait faire des requêtes supplémentaires si nécessaire
        crm: row.has_crm ? {} : null,
        hubspot: row.has_hubspot ? {} : null,
        apollo: row.has_apollo ? {} : null,
      },
      lastUpdated: row.last_updated,
      sourceCount: row.source_count || 0,
    })) as UnifiedProspect[];
  }, [viewData]);

  const totalCount = viewData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const uniqueEmails = statsData?.uniqueEmails || 0;
  const multiSourceCount = statsData?.multiSourceCount || 0;

  return {
    data: unifiedData,
    loading,
    error,
    totalCount,
    totalPages,
    uniqueEmails,
    multiSourceCount,
    refetch,
  };
};
