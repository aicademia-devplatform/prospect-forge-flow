import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MySalesLeads from '@/pages/MySalesLeads';

interface CreatedTable {
  id: string;
  tableName: string;
  customTableName?: string;
  columnConfig: any[];
  tableSettings: any;
  createdAt: string;
  totalRecords: number;
}

const Prospects = () => {
  const { userRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [createdTables, setCreatedTables] = useState<CreatedTable[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch created tables for "created" tab
  useEffect(() => {
    const fetchCreatedTables = async () => {
      if (!user || activeTab !== 'created') return;
      
      setLoading(true);
      try {
        const { data: tableConfigs, error: tableError } = await supabase
          .from('sales_table_config')
          .select('*')
          .eq('sales_user_id', user.id);

        if (tableError) throw tableError;

        const createdTablesData: CreatedTable[] = [];
        
        for (const config of tableConfigs || []) {
          // Get record count for each table
          let recordCount = 0;
          try {
            if (config.table_name === 'apollo_contacts') {
              const { count } = await supabase
                .from('apollo_contacts')
                .select('*', { count: 'exact', head: true });
              recordCount = count || 0;
            } else if (config.table_name === 'crm_contacts') {
              const { count } = await supabase
                .from('crm_contacts')
                .select('*', { count: 'exact', head: true });
              recordCount = count || 0;
            }
          } catch (error) {
            console.error('Error fetching record count:', error);
          }

          createdTablesData.push({
            id: config.id,
            tableName: config.table_name,
            customTableName: (config.table_settings as any)?.displayName || config.table_name,
            columnConfig: config.column_config as any[],
            tableSettings: config.table_settings as any,
            createdAt: config.created_at,
            totalRecords: recordCount
          });
        }

        setCreatedTables(createdTablesData);
      } catch (error) {
        console.error('Error fetching created tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatedTables();
  }, [user, activeTab]);

  const formatDate = (dateString: string) => {
    moment.locale('fr');
    const now = moment();
    const dateValue = moment(dateString);
    const daysDiff = now.diff(dateValue, 'days');
    
    // Si plus d'une semaine (7 jours), afficher la date formatée
    if (daysDiff > 7) {
      return dateValue.format('D MMM YYYY');
    } else {
      // Sinon, afficher la notation relative
      return dateValue.fromNow();
    }
  };

  const handleBackToMain = () => {
    // This will be handled by parent component or navigation
    window.history.back();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMain}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Prospects</h1>
          </div>
          <div className="flex items-center space-x-4">
            {userRole && (
              <span className="text-sm text-muted-foreground">
                Rôle: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
            <UserMenu />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">
              Prospects Assignés
            </TabsTrigger>
            <TabsTrigger value="rappeler">
              Prospects à rappeler
            </TabsTrigger>
            <TabsTrigger value="traites">
              Prospects Traités
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 mt-6">
            {/* Prospects assignés via MySalesLeads */}
            <MySalesLeads />
          </TabsContent>

          <TabsContent value="rappeler" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Liste des prospects à rappeler</p>
            </div>
          </TabsContent>

          <TabsContent value="traites" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Liste des prospects traités</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Prospects;