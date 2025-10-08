import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, User, Calendar, FileText, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createProspectUrl } from '@/lib/emailCrypto';
import { ValiderProspectDialog } from '@/components/ValiderProspectDialog';
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

interface ValidatedProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  rdv_date: string;
  rdv_notes: string | null;
  commentaire_validation: string;
  validated_at: string;
  validated_by: string;
  sales_user_id: string;
  sdr_id: string;
}

interface ArchivedProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  commentaire_rejet: string;
  raison_rejet: string | null;
  rejected_at: string;
  rejected_by: string;
  sales_user_id: string;
  sdr_id: string | null;
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
  const [validatedProspects, setValidatedProspects] = useState<ValidatedProspect[]>([]);
  const [archivedProspects, setArchivedProspects] = useState<ArchivedProspect[]>([]);
  const [contactsData, setContactsData] = useState<Record<string, ContactData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<SDRProspect | null>(null);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);

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
    fetchAllProspects();
  }, [user]);

  const fetchAllProspects = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Récupérer les prospects prévalidés (SDR)
      const { data: prevalidatedData, error: prevalidatedError } = await supabase
        .from('sales_sdr_prospects_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (prevalidatedError) throw prevalidatedError;
      setProspects((prevalidatedData || []) as SDRProspect[]);

      // Récupérer les prospects validés avec RDV
      const { data: validatedData, error: validatedError } = await supabase
        .from('prospects_valides')
        .select('*')
        .order('validated_at', { ascending: false });

      if (validatedError) throw validatedError;
      setValidatedProspects((validatedData || []) as ValidatedProspect[]);

      // Récupérer les prospects archivés/rejetés
      const { data: archivedData, error: archivedError } = await supabase
        .from('prospects_archives')
        .select('*')
        .order('rejected_at', { ascending: false });

      if (archivedError) throw archivedError;
      setArchivedProspects((archivedData || []) as ArchivedProspect[]);

      // Récupérer les informations des contacts
      const allEmails = [
        ...new Set([
          ...(prevalidatedData || []).map(p => p.lead_email),
          ...(validatedData || []).map(p => p.lead_email),
          ...(archivedData || []).map(p => p.lead_email),
        ])
      ];
      await fetchContactsData(allEmails);
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

  const handleTraiterProspect = (prospect: SDRProspect) => {
    setSelectedProspect(prospect);
    setIsValidationDialogOpen(true);
  };

  const handleValidationSuccess = () => {
    fetchAllProspects(); // Rafraîchir la liste
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
            Rendez-vous programmés ({validatedProspects.length})
          </TabsTrigger>
          <TabsTrigger value="traites">
            Prospects traités ({validatedProspects.length + archivedProspects.length})
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
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewProspect(prospect.lead_email)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleTraiterProspect(prospect)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Traiter
                                  </Button>
                                </div>
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
                <CardTitle>Rendez-vous programmés</CardTitle>
                <CardDescription>
                  Prospects validés avec rendez-vous planifiés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Date RDV</TableHead>
                        <TableHead>Commentaire</TableHead>
                        <TableHead>Notes RDV</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validatedProspects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Aucun rendez-vous programmé
                          </TableCell>
                        </TableRow>
                      ) : (
                        validatedProspects
                          .filter(prospect => {
                            const contact = contactsData[prospect.lead_email];
                            const searchLower = searchTerm.toLowerCase();
                            return !searchTerm || 
                              prospect.lead_email.toLowerCase().includes(searchLower) ||
                              (contact?.first_name?.toLowerCase().includes(searchLower)) ||
                              (contact?.last_name?.toLowerCase().includes(searchLower)) ||
                              (contact?.company?.toLowerCase().includes(searchLower));
                          })
                          .map((prospect) => {
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
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(prospect.rdv_date)}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="flex items-start gap-1">
                                    <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm line-clamp-2">{prospect.commentaire_validation}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  {prospect.rdv_notes && (
                                    <span className="text-sm line-clamp-2">{prospect.rdv_notes}</span>
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
                  Tous les prospects validés ou rejetés par le sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date de traitement</TableHead>
                        <TableHead>Commentaire</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validatedProspects.length === 0 && archivedProspects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Aucun prospect traité
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {validatedProspects
                            .filter(prospect => {
                              const contact = contactsData[prospect.lead_email];
                              const searchLower = searchTerm.toLowerCase();
                              return !searchTerm || 
                                prospect.lead_email.toLowerCase().includes(searchLower) ||
                                (contact?.first_name?.toLowerCase().includes(searchLower)) ||
                                (contact?.last_name?.toLowerCase().includes(searchLower)) ||
                                (contact?.company?.toLowerCase().includes(searchLower));
                            })
                            .map((prospect) => {
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
                                    <Badge variant="default" className="bg-green-600">Validé</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(prospect.validated_at)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="flex items-start gap-1">
                                      <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm line-clamp-2">{prospect.commentaire_validation}</span>
                                    </div>
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
                            })}
                          {archivedProspects
                            .filter(prospect => {
                              const contact = contactsData[prospect.lead_email];
                              const searchLower = searchTerm.toLowerCase();
                              return !searchTerm || 
                                prospect.lead_email.toLowerCase().includes(searchLower) ||
                                (contact?.first_name?.toLowerCase().includes(searchLower)) ||
                                (contact?.last_name?.toLowerCase().includes(searchLower)) ||
                                (contact?.company?.toLowerCase().includes(searchLower));
                            })
                            .map((prospect) => {
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
                                    <Badge variant="destructive">Rejeté</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(prospect.rejected_at)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="flex items-start gap-1">
                                      <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm line-clamp-2">{prospect.commentaire_rejet}</span>
                                    </div>
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
                            })}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {selectedProspect && (
        <ValiderProspectDialog
          open={isValidationDialogOpen}
          onOpenChange={setIsValidationDialogOpen}
          prospect={selectedProspect}
          onSuccess={handleValidationSuccess}
        />
      )}
    </motion.div>
  );
};

export default SalesProspects;
