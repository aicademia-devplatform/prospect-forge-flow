import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Table, RefreshCw, Activity, Eye, GitMerge } from 'lucide-react';
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
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniqueEmails, setUniqueEmails] = useState(0);
  const [multiSourceCount, setMultiSourceCount] = useState(0);
  const {
    toast
  } = useToast();
  const fetchTableInfo = async () => {
    setLoading(true);
    try {
      // Compter les enregistrements Apollo
      const {
        count: apolloCount
      } = await supabase.from('apollo_contacts').select('*', {
        count: 'exact',
        head: true
      });

      // Compter les enregistrements CRM
      const {
        count: crmCount
      } = await supabase.from('crm_contacts').select('*', {
        count: 'exact',
        head: true
      });

      // Compter les enregistrements HubSpot
      const {
        count: hubspotCount
      } = await supabase.from('hubspot_contacts' as any).select('*', {
        count: 'exact',
        head: true
      });

      // Obtenir les dernières dates de mise à jour
      const {
        data: apolloLatest
      } = await supabase.from('apollo_contacts').select('updated_at').order('updated_at', {
        ascending: false
      }).limit(1).maybeSingle();
      const {
        data: crmLatest
      } = await supabase.from('crm_contacts').select('updated_at').order('updated_at', {
        ascending: false
      }).limit(1).maybeSingle();
      const {
        data: hubspotLatest
      } = await supabase.from('hubspot_contacts' as any).select('inserted_at').order('inserted_at', {
        ascending: false
      }).limit(1).maybeSingle();
      const tableData: TableInfo[] = [{
        name: 'apollo_contacts',
        description: 'Contacts et prospects importés depuis Apollo.io avec informations détaillées sur les entreprises et contacts.',
        rowCount: apolloCount || 0,
        lastUpdated: apolloLatest?.updated_at || 'Jamais',
        status: 'active'
      }, {
        name: 'crm_contacts',
        description: 'Base de données CRM principale avec contacts, historique des interactions et statuts de prospection.',
        rowCount: crmCount || 0,
        lastUpdated: crmLatest?.updated_at || 'Jamais',
        status: 'active'
      }, {
        name: 'hubspot_contacts',
        description: 'Contacts et données importés depuis HubSpot avec informations détaillées sur les interactions et le lifecycle.',
        rowCount: hubspotCount || 0,
        lastUpdated: (hubspotLatest as any)?.inserted_at || 'Jamais',
        status: 'active'
      }];
      setTables(tableData);

      // Calculer les statistiques de la vue 360
      // Récupérer tous les emails uniques de toutes les sources
      const allEmails = new Set<string>();
      const emailSources = new Map<string, number>();

      // Apollo emails
      const {
        data: apolloEmails
      } = await supabase.from('apollo_contacts').select('email');
      apolloEmails?.forEach((item: any) => {
        if (item.email) {
          const email = item.email.toLowerCase().trim();
          allEmails.add(email);
          emailSources.set(email, (emailSources.get(email) || 0) + 1);
        }
      });

      // CRM emails
      const {
        data: crmEmails
      } = await supabase.from('crm_contacts').select('email');
      crmEmails?.forEach((item: any) => {
        if (item.email) {
          const email = item.email.toLowerCase().trim();
          allEmails.add(email);
          emailSources.set(email, (emailSources.get(email) || 0) + 1);
        }
      });

      // HubSpot emails
      const {
        data: hubspotEmails
      } = await supabase.from('hubspot_contacts' as any).select('primary_email');
      hubspotEmails?.forEach((item: any) => {
        if (item.primary_email) {
          const email = item.primary_email.toLowerCase().trim();
          allEmails.add(email);
          emailSources.set(email, (emailSources.get(email) || 0) + 1);
        }
      });
      setUniqueEmails(allEmails.size);
      setMultiSourceCount(Array.from(emailSources.values()).filter(count => count > 1).length);
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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'syncing':
        return 'Synchronisation';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  // Rendu principal de la page sources de données
  return <div className="p-6 space-y-6">
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

      {/* Card Vue 360 */}
      <Card className="border-2 border-primary bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Vue 360° des Prospects
                  <Badge className="bg-blue-500">Nouveau</Badge>
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Vue unifiée et dédupliquée de tous vos contacts depuis toutes les sources
                </CardDescription>
              </div>
            </div>
            
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <div className="p-3 bg-blue-100 rounded-full">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '...' : uniqueEmails.toLocaleString('fr-FR')}
                </p>
                <p className="text-sm text-muted-foreground">Contacts uniques</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <div className="p-3 bg-green-100 rounded-full">
                <GitMerge className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : multiSourceCount.toLocaleString('fr-FR')}
                </p>
                <p className="text-sm text-muted-foreground">Multi-sources</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <div className="p-3 bg-purple-100 rounded-full">
                <Table className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-sm text-muted-foreground">Sources agrégées</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <GitMerge className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900">Agrégation intelligente</p>
                <p className="text-sm text-blue-700 mt-1">
                  Les données des 3 sources sont fusionnées par email avec priorisation CRM &gt; HubSpot &gt; Apollo. 
                  Visualisez tous vos prospects en un seul endroit avec toutes leurs informations disponibles.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
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
            </Card>)}
        </div> : <div className="grid gap-6 md:grid-cols-3">
          {tables.map(table => <Card key={table.name} className="hover:shadow-lg transition-shadow">
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
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/datasources/${table.name}`}>
                      Voir les données
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>)}
        </div>}

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
    </div>;
};
export default DataSources;