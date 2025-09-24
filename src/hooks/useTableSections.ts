import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  value: string;
  label: string;
  count: number;
}

export const useTableSections = (tableName: 'apollo_contacts' | 'crm_contacts') => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      if (tableName !== 'crm_contacts') {
        setSections([]);
        return;
      }

      setLoading(true);
      try {
        const { data: response, error } = await supabase.functions.invoke('table-sections', {
          body: { tableName }
        });

        if (error) {
          console.error('Error fetching sections:', error);
          return;
        }

        setSections(response?.sections || []);
      } catch (error) {
        console.error('Error fetching sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [tableName]);

  return { sections, loading };
};