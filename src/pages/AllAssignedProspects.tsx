import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Mail, Building, User, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLoader from '@/components/dashboard/DashboardLoader';
import { encryptEmail } from '@/lib/emailCrypto';

interface AssignedProspect {
  id: string;
  lead_email: string;
  sales_user_id: string;
  sdr_email: string;
  sdr_name: string;
  assigned_at: string;
  status: string;
  source_table: string;
  // Données du contact
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
}

const AllAssignedProspects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prospects, setProspects] = useState<AssignedProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignedProspects();
  }, [user]);

  const fetchAssignedProspects = async () => {
    try {
      if (!user) return;

      // Récupérer les assignations avec les informations des SDR
      const { data: assignments, error: assignError } = await supabase
        .from('sales_assignments')
        .select(`
          id,
          lead_email,
          sales_user_id,
          assigned_at,
          status,
          source_table,
          source_id,
          manager_id
        `)
        .eq('status', 'active')
        .eq('manager_id', user.id)
        .order('assigned_at', { ascending: false });

      if (assignError) throw assignError;

      // Récupérer les profils des SDR
      const sdrIds = [...new Set(assignments?.map(a => a.sales_user_id) || [])];
      const { data: sdrProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', sdrIds);

      if (profileError) throw profileError;

      // Créer un map des SDR
      const sdrMap = new Map(
        sdrProfiles?.map(sdr => [
          sdr.id, 
          { 
            email: sdr.email, 
            name: sdr.first_name && sdr.last_name 
              ? `${sdr.first_name} ${sdr.last_name}` 
              : sdr.email 
          }
        ]) || []
      );

      // Récupérer les emails des prospects
      const emails = assignments?.map(a => a.lead_email) || [];

      // Récupérer les données des contacts depuis les deux tables
      const { data: crmContacts } = await supabase
        .from('crm_contacts')
        .select('email, firstname, name, company')
        .in('email', emails);

      const { data: apolloContacts } = await supabase
        .from('apollo_contacts')
        .select('email, first_name, last_name, company, title')
        .in('email', emails);

      // Créer un map des contacts
      const contactMap = new Map();
      crmContacts?.forEach(c => {
        contactMap.set(c.email, {
          first_name: c.firstname,
          last_name: c.name,
          company: c.company
        });
      });
      apolloContacts?.forEach(c => {
        if (!contactMap.has(c.email)) {
          contactMap.set(c.email, {
            first_name: c.first_name,
            last_name: c.last_name,
            company: c.company,
            title: c.title
          });
        }
      });

      // Combiner les données
      const enrichedProspects: AssignedProspect[] = assignments?.map(assignment => {
        const sdrInfo = sdrMap.get(assignment.sales_user_id);
        const contactInfo = contactMap.get(assignment.lead_email);
        
        return {
          id: assignment.id,
          lead_email: assignment.lead_email,
          sales_user_id: assignment.sales_user_id,
          sdr_email: sdrInfo?.email || '',
          sdr_name: sdrInfo?.name || '',
          assigned_at: assignment.assigned_at,
          status: assignment.status,
          source_table: assignment.source_table,
          first_name: contactInfo?.first_name,
          last_name: contactInfo?.last_name,
          company: contactInfo?.company,
          title: contactInfo?.title
        };
      }) || [];

      setProspects(enrichedProspects);
    } catch (error) {
      console.error('Error fetching assigned prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const searchLower = searchTerm.toLowerCase();
    return (
      prospect.lead_email.toLowerCase().includes(searchLower) ||
      prospect.sdr_email.toLowerCase().includes(searchLower) ||
      prospect.sdr_name.toLowerCase().includes(searchLower) ||
      prospect.company?.toLowerCase().includes(searchLower) ||
      prospect.first_name?.toLowerCase().includes(searchLower) ||
      prospect.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const handleRowClick = (email: string) => {
    const encryptedEmail = encryptEmail(email);
    navigate(`/prospect/${encryptedEmail}`);
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tous les prospects assignés</h1>
          <p className="text-muted-foreground">Liste complète des prospects assignés à votre équipe</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-[hsl(var(--accent-blue))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prospects.length}</div>
            <p className="text-xs text-muted-foreground">Assignés à l'équipe</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--accent-green))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SDR Actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(prospects.map(p => p.sales_user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Membres de l'équipe</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--accent-purple))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(prospects.map(p => p.company).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">Uniques</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prospects assignés</CardTitle>
                <CardDescription>
                  {filteredProspects.length} prospects{searchTerm && ` (${prospects.length} au total)`}
                </CardDescription>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email, SDR, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProspects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucun prospect assigné'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SDR Assigné</TableHead>
                      <TableHead>Date d'assignation</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProspects.map((prospect) => (
                      <TableRow 
                        key={prospect.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(prospect.lead_email)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {prospect.first_name || prospect.last_name
                                  ? `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim()
                                  : prospect.lead_email}
                              </span>
                              {prospect.title && (
                                <span className="text-xs text-muted-foreground">{prospect.title}</span>
                              )}
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {prospect.company || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{prospect.lead_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{prospect.sdr_name}</span>
                            <span className="text-xs text-muted-foreground">{prospect.sdr_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(prospect.assigned_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {prospect.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AllAssignedProspects;
