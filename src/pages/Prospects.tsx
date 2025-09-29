import React from 'react';
import { ProspectTableAdvanced } from '@/components/ProspectTableAdvanced';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prospects</h1>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">
              Prospects Assignés
            </TabsTrigger>
            <TabsTrigger value="created">
              Tables Créées ({createdTables.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 mt-6">
            <ProspectTableAdvanced showTitle={false} />
          </TabsContent>

          <TabsContent value="created" className="space-y-4 mt-6">
            {loading ? (
              <div className="p-4">Chargement des tables créées...</div>
            ) : createdTables.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucune table créée pour le moment</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une nouvelle table
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdTables.map((table) => (
                  <div key={table.id} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{table.customTableName}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir la table</DropdownMenuItem>
                          <DropdownMenuItem>Modifier la configuration</DropdownMenuItem>
                          <DropdownMenuItem>Exporter les données</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Supprimer la table
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Source: <span className="font-medium">{table.tableName}</span>
                    </p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="font-medium">
                        {table.totalRecords.toLocaleString()} enregistrements
                      </span>
                      <span className="text-muted-foreground">
                        Créé le {formatDate(table.createdAt)}
                      </span>
                    </div>
                    <Button size="sm" className="w-full">
                      Ouvrir la table
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Prospects;