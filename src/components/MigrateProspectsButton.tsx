import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw } from 'lucide-react';

export const MigrateProspectsButton: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleMigration = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-existing-traites');
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Migration réussie',
        description: `${data.migrated} prospects ont été migrés vers la table des prospects traités.`,
      });

      // Refresh the page after successful migration
      window.location.reload();
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Erreur de migration',
        description: 'Impossible de migrer les prospects existants.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleMigration}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Migrer les prospects bouclés existants
    </Button>
  );
};