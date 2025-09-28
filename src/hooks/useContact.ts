import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseContactParams {
  tableName: 'apollo_contacts' | 'crm_contacts';
  contactId: string;
}

export const useContact = (params: UseContactParams) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchContact = async () => {
    setLoading(true);
    try {
      console.log('Fetching contact with params:', params);
      
      const { data: response, error } = await supabase.functions.invoke('get-contact', {
        body: params
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Received contact data:', response);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData([]);
      }
      
    } catch (error) {
      console.error('Error fetching contact:', error);
      setData([]);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détails du contact."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.tableName && params.contactId) {
      fetchContact();
    }
  }, [params.tableName, params.contactId]);

  return {
    data,
    loading,
    refetch: fetchContact
  };
};