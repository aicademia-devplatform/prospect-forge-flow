import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Table, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TableInfo {
  name: string;
  description: string;
  rowCount: number;
  lastUpdated: string;
  status: 'active' | 'syncing' | 'error';
}

const DataSources = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTableInfo = async () => {
    setLoading(true);
    try {
      // Compter les enregistrements Apollo
      const { count: apolloCount } = await supabase
        .from('apollo_contacts')
        .select('*', { count: 'exact', head: true });

      // Compter les enregistrements CRM
      const { count: crmCount } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true });

      // Compter les enregistrements HubSpot
      const { count: hubspotCount } = await supabase
        .from('hubspot_contacts' as any)
        .select('*', { count: 'exact', head: true });

      // Obtenir les dernières dates de mise à jour
      const { data: apolloLatest } = await supabase
        .from('apollo_contacts')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: crmLatest } = await supabase
        .from('crm_contacts')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: hubspotLatest } = await supabase
        .from('hubspot_contacts' as any)
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const tableData: TableInfo[] = [
        {
          name: 'apollo_contacts',
          description: 'Contacts et prospects importés depuis Apollo.io avec informations détaillées sur les entreprises et contacts.',
          rowCount: apolloCount || 0,
          lastUpdated: apolloLatest?.updated_at || 'Jamais',
          status: 'active'
        },
        {
          name: 'crm_contacts',
          description: 'Base de données CRM principale avec contacts, historique des interactions et statuts de prospection.',
          rowCount: crmCount || 0,
          lastUpdated: crmLatest?.updated_at || 'Jamais',
          status: 'active'
        },
        {
          name: 'hubspot_contacts',
          description: 'Contacts et données importés depuis HubSpot avec informations détaillées sur les interactions et le lifecycle.',
          rowCount: hubspotCount || 0,
          lastUpdated: (hubspotLatest as any)?.updated_at || 'Jamais',
          status: 'active'
        }
      ];

      setTables(tableData);
    } catch (error) {
      console.error('Erreur lors du chargement des sources de données:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations des sources de données."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableInfo();
  }, []);

  const formatDate = (dateString: string) => {
    if (dateString === 'Jamais') return dateString;
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'syncing': return 'Synchronisation';
      case 'error': return 'Erreur';
      default: return 'Inconnu';
    }
  };

  // Rendu principal de la page sources de données
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sources de données</h1>
          <p className="text-muted-foreground">
            Gérez et surveillez vos sources de données CRM
          </p>
        </div>
        <Button onClick={fetchTableInfo} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{table.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(table.status)}>
                    {getStatusText(table.status)}
                  </Badge>
                </div>
                <CardDescription>{table.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Enregistrements</p>
                      <p className="text-lg font-bold text-primary">
                        {table.rowCount.toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dernière mise à jour</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(table.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    asChild
                  >
                    <Link to={`/datasources/${table.name}`}>
                      Voir les données
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Informations de la base de données</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {tables.reduce((sum, table) => sum + table.rowCount, 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-muted-foreground">Total des enregistrements</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{tables.length}</p>
              <p className="text-sm text-muted-foreground">Sources de données</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {tables.filter(t => t.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Sources actives</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;