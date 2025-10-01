import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Trash2, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface ProspectSummary {
  email: string;
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  source: 'crm_contacts' | 'apollo_contacts';
  created_at: string;
  is_assigned: boolean;
}

const AdminProspectsTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    crm: 0,
    apollo: 0,
    assigned: 0
  });

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);

      // Charger les prospects CRM
      const { data: crmData, error: crmError } = await supabase
        .from('crm_contacts')
        .select('email, company, firstname, name, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (crmError) throw crmError;

      // Charger les assignations
      const { data: assignments, error: assignmentsError } = await supabase
        .from('sales_assignments')
        .select('lead_email');

      if (assignmentsError) throw assignmentsError;

      const assignedEmails = new Set(assignments?.map(a => a.lead_email) || []);

      // Transformer les données
      const crmProspects: ProspectSummary[] = (crmData || []).map(p => ({
        email: p.email,
        company: p.company,
        first_name: p.firstname,
        last_name: p.name,
        source: 'crm_contacts' as const,
        created_at: p.created_at,
        is_assigned: assignedEmails.has(p.email)
      }));

      setProspects(crmProspects);

      // Calculer les stats
      const { count: totalCount } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true });

      const { count: apolloCount } = await supabase
        .from('apollo_contacts')
        .select('*', { count: 'exact', head: true });

      setStats({
        total: (totalCount || 0) + (apolloCount || 0),
        crm: totalCount || 0,
        apollo: apolloCount || 0,
        assigned: assignedEmails.size
      });
    } catch (error) {
      console.error('Error loading prospects:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProspects = prospects.filter(p =>
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.crm}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Apollo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apollo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assignés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Base de données prospects</CardTitle>
              <CardDescription>Gestion de tous les prospects</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/prospects')}>
              <Database className="h-4 w-4 mr-2" />
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un prospect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.slice(0, 20).map((prospect, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{prospect.email}</TableCell>
                    <TableCell>
                      {prospect.first_name && prospect.last_name
                        ? `${prospect.first_name} ${prospect.last_name}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{prospect.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {prospect.source === 'crm_contacts' ? 'CRM' : 'Apollo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prospect.is_assigned ? (
                        <Badge variant="default">Assigné</Badge>
                      ) : (
                        <Badge variant="outline">Non assigné</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProspectsTab;
