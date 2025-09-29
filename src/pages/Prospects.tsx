import React, { useState, useEffect } from 'react';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import TableView from '@/components/TableView';

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">
              Prospects Assignés
            </TabsTrigger>
            <TabsTrigger value="created">
              Tables Créées ({createdTables.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="space-y-4 mt-6">
            <ProspectTableView />
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

// Component wrapper for the assigned prospects table that uses TableView
const ProspectTableView = () => {
  const handleBack = () => {
    // Not needed for this embedded view
  };

  return (
    <AssignedProspectsTableView onBack={handleBack} />
  );
};

// Custom component that uses the same TableView but with assigned prospects data
const AssignedProspectsTableView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // We'll modify the useTableData hook temporarily to use our assigned-prospects endpoint
  const [showTableView, setShowTableView] = useState(true);

  if (showTableView) {
    // Use the existing TableView but with a special "mode" for assigned prospects
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Prospects Assignés</h3>
              <p className="text-blue-700 text-sm mt-1">
                Visualisez et gérez tous vos prospects assignés depuis les différentes sources de données.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Vue Prospects
              </span>
            </div>
          </div>
        </div>
        
        {/* Use a placeholder for now - we'll need to create a modified TableView */}
        <AssignedProspectsTable />
      </div>
    );
  }

  return null;
};

// Simplified table component for assigned prospects - uses same interface as TableView
const AssignedProspectsTable = () => {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Tableau des Prospects Assignés</h3>
            <p className="text-sm text-muted-foreground">
              Interface complète avec recherche, filtres, tri et actions - identique au tableau principal
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tableau des Prospects en Préparation
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Le tableau complet avec toutes les fonctionnalités (recherche, filtres, sections Arlynk/Aicademia, 
            tri, pagination, édition inline, export, etc.) sera disponible sous peu.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline">
              Voir un aperçu des données
            </Button>
            <Button>
              Configurer les colonnes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prospects;