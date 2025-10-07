import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, User, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createProspectUrl } from '@/lib/emailCrypto';
import moment from 'moment';
import 'moment/locale/fr';
import { motion } from 'framer-motion';

interface SDRProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  sales_user_id: string;
  notes_sales: string | null;
  statut_prospect: string | null;
  date_action: string | null;
  completed_at: string | null;
  sdr_id: string;
  sdr_email: string;
  sdr_first_name: string | null;
  sdr_last_name: string | null;
  prospect_type: 'traites' | 'rappeler';
  created_at: string;
}

interface ContactData {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  mobile_phone?: string;
  person_linkedin_url?: string;
}

const SalesProspects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  
  const [prospects, setProspects] = useState<SDRProspect[]>([]);
  const [contactsData, setContactsData] = useState<Record<string, ContactData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Déterminer l'onglet actif depuis l'URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/sales-prospects/rappeler')) return 'rappeler';
    if (path.includes('/sales-prospects/traites')) return 'traites';
    return 'prevalidated';
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (value: string) => {
    if (value === 'prevalidated') {
      navigate('/sales-prospects');
    } else if (value === 'rappeler') {
      navigate('/sales-prospects/rappeler');
    } else if (value === 'traites') {
      navigate('/sales-prospects/traites');
    }
  };

  // Rediriger vers /sales-prospects si on est sur la route de base
  useEffect(() => {
    if (location.pathname === '/sales-prospects') {
      // On reste sur prevalidated
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchProspects();
  }, [user]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Récupérer tous les prospects des SDR via la vue
      const { data, error } = await supabase
        .from('sales_sdr_prospects_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProspects((data || []) as SDRProspect[]);

      // Récupérer les informations des contacts
      const emails = [...new Set((data || []).map(p => p.lead_email))];
      await fetchContactsData(emails);
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactsData = async (emails: string[]) => {
    try {
      // Récupérer depuis crm_contacts d'abord
      const { data: crmData, error: crmError } = await supabase
        .from('crm_contacts')
        .select('email, firstname, name, company, mobile, linkedin_url')
        .in('email', emails);

      if (crmError) throw crmError;

      // Récupérer depuis apollo_contacts pour compléter
      const { data: apolloData, error: apolloError } = await supabase
        .from('apollo_contacts')
        .select('email, first_name, last_name, company, title, mobile_phone, person_linkedin_url')
        .in('email', emails);

      if (apolloError) throw apolloError;

      // Fusionner les données
      const contactsMap: Record<string, ContactData> = {};
      
      crmData?.forEach(contact => {
        contactsMap[contact.email] = {
          email: contact.email,
          first_name: contact.firstname || '',
          last_name: contact.name || '',
          company: contact.company || '',
          mobile_phone: contact.mobile || '',
          person_linkedin_url: contact.linkedin_url || ''
        };
      });

      apolloData?.forEach(contact => {
        if (!contactsMap[contact.email]) {
          contactsMap[contact.email] = {
            email: contact.email,
            first_name: contact.first_name || '',
            last_name: contact.last_name || '',
            company: contact.company || '',
            title: contact.title || '',
            mobile_phone: contact.mobile_phone || '',
            person_linkedin_url: contact.person_linkedin_url || ''
          };
        }
      });

      setContactsData(contactsMap);
    } catch (error) {
      console.error('Error fetching contacts data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    moment.locale('fr');
    return moment(dateString).format('DD/MM/YYYY à HH:mm');
  };

  const filteredProspects = prospects.filter(prospect => {
    const contact = contactsData[prospect.lead_email];
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      prospect.lead_email.toLowerCase().includes(searchLower) ||
      prospect.sdr_email.toLowerCase().includes(searchLower) ||
      (contact?.first_name?.toLowerCase().includes(searchLower)) ||
      (contact?.last_name?.toLowerCase().includes(searchLower)) ||
      (contact?.company?.toLowerCase().includes(searchLower));

    if (activeTab === 'prevalidated') {
      // Afficher tous les prospects (traités et à rappeler) dans "Prospects prévalidés"
      return matchesSearch;
    } else if (activeTab === 'rappeler') {
      return matchesSearch && prospect.prospect_type === 'rappeler';
    } else if (activeTab === 'traites') {
      return matchesSearch && prospect.prospect_type === 'traites';
    }

    return matchesSearch;
  });

  const handleViewProspect = (email: string) => {
    const encryptedEmail = createProspectUrl(email);
    navigate(`/prospect/${encryptedEmail}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des prospects...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Prospects SDR</h1>
        <p className="text-muted-foreground">Suivi des prospects traités par les SDR</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, SDR, nom, entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prevalidated">
            Prospects prévalidés ({prospects.length})
          </TabsTrigger>
          <TabsTrigger value="rappeler">
            À rappeler ({prospects.filter(p => p.prospect_type === 'rappeler').length})
          </TabsTrigger>
          <TabsTrigger value="traites">
            Traités ({prospects.filter(p => p.prospect_type === 'traites').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prevalidated" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Tous les prospects prévalidés par les SDR</CardTitle>
                <CardDescription>
                  Liste complète avec toutes les informations et notes des SDR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>SDR</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date d'action</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Aucun prospect trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProspects.map((prospect) => {
                          const contact = contactsData[prospect.lead_email];
                          return (
                            <TableRow key={prospect.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {contact?.first_name} {contact?.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {prospect.lead_email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{contact?.company || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {prospect.sdr_first_name} {prospect.sdr_last_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {prospect.sdr_email}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {prospect.statut_prospect && (
                                  <Badge variant="outline">{prospect.statut_prospect}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={prospect.prospect_type === 'traites' ? 'default' : 'secondary'}
                                >
                                  {prospect.prospect_type === 'traites' ? 'Traité' : 'À rappeler'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {prospect.date_action && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(prospect.date_action)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                {prospect.notes_sales && (
                                  <div className="flex items-start gap-1">
                                    <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm line-clamp-2">{prospect.notes_sales}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProspect(prospect.lead_email)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="rappeler" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Prospects à rappeler</CardTitle>
                <CardDescription>
                  Prospects identifiés par les SDR nécessitant un rappel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>SDR</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date d'action</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Aucun prospect à rappeler
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProspects.map((prospect) => {
                          const contact = contactsData[prospect.lead_email];
                          return (
                            <TableRow key={prospect.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {contact?.first_name} {contact?.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {prospect.lead_email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{contact?.company || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {prospect.sdr_first_name} {prospect.sdr_last_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {prospect.sdr_email}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {prospect.statut_prospect && (
                                  <Badge variant="outline">{prospect.statut_prospect}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {prospect.date_action && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(prospect.date_action)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                {prospect.notes_sales && (
                                  <div className="flex items-start gap-1">
                                    <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm line-clamp-2">{prospect.notes_sales}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProspect(prospect.lead_email)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="traites" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Prospects traités</CardTitle>
                <CardDescription>
                  Liste des prospects finalisés par les SDR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>SDR</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date de finalisation</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Aucun prospect traité
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProspects.map((prospect) => {
                          const contact = contactsData[prospect.lead_email];
                          return (
                            <TableRow key={prospect.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {contact?.first_name} {contact?.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {prospect.lead_email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{contact?.company || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {prospect.sdr_first_name} {prospect.sdr_last_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {prospect.sdr_email}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {prospect.statut_prospect && (
                                  <Badge variant="outline">{prospect.statut_prospect}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {prospect.completed_at && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(prospect.completed_at)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                {prospect.notes_sales && (
                                  <div className="flex items-start gap-1">
                                    <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm line-clamp-2">{prospect.notes_sales}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProspect(prospect.lead_email)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SalesProspects;
