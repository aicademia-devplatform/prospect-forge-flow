import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Phone, MapPin, Mail, ExternalLink, Edit, FileText, Code, Database, Globe, Laptop, Server, Shield, Smartphone, Cpu, Cloud, Zap } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TraiterProspectSidebar } from '@/components/TraiterProspectSidebar';
import { ModifierProspectSidebar } from '@/components/ModifierProspectSidebar';
import { ProspectActionSidebar } from '@/components/ProspectActionSidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractEmailFromUrl } from '@/lib/emailCrypto';
import moment from 'moment';
import 'moment/locale/fr';
interface ProspectData {
  // CRM Data
  crm_id?: string;
  email: string;
  crm_firstname?: string;
  crm_name?: string;
  crm_company?: string;
  crm_city?: string;
  crm_country?: string;
  crm_mobile?: string;
  crm_linkedin_url?: string;
  zoho_status?: string;

  // Apollo Data
  apollo_id?: string;
  apollo_firstname?: string;
  apollo_lastname?: string;
  apollo_title?: string;
  apollo_company?: string;
  apollo_email_status?: string;
  apollo_seniority?: string;
  apollo_departments?: string;
  apollo_contact_owner?: string;
  apollo_phone?: string;
  apollo_mobile?: string;
  apollo_nb_employees?: number;
  apollo_industry?: string;
  apollo_linkedin_url?: string;
  apollo_company_linkedin_url?: string;
  apollo_website?: string;
  apollo_stage?: string;
  apollo_lists?: string;
  apollo_last_contacted?: string;
  apollo_status?: string;
  apollo_contact_id?: string;
  apollo_account_id?: string;
  apollo_city?: string;
  apollo_country?: string;
  apollo_email_sent?: boolean;
  apollo_email_open?: boolean;
  apollo_replied?: boolean;
  apollo_demoed?: boolean;
  apollo_technologies?: string;

  // Common fields
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  industry?: string;
  nb_employees?: number;
  mobile_phone?: string;
  work_direct_phone?: string;
  person_linkedin_url?: string;
  website?: string;
  city?: string;
  country?: string;
  data_source?: string;
  created_at?: string;
  updated_at?: string;

  // Additional CRM fields
  firstname?: string;
  name?: string;
  tel?: string;
  mobile?: string;
  mobile_2?: string;
  tel_pro?: string;
  address?: string;
  departement?: string;
  industrie?: string;
  linkedin_function?: string;
  company_website?: string;
  linkedin_company_url?: string;

  // Sources data
  sources?: Array<{
    source_table: string;
    data: any;
  }>;
}
const ProspectDetails: React.FC = () => {
  // Fonction pour obtenir l'icône appropriée pour chaque technologie
  const getTechIcon = (techName: string) => {
    const tech = techName.toLowerCase().trim();
    if (tech.includes('react') || tech.includes('vue') || tech.includes('angular') || tech.includes('javascript') || tech.includes('js')) return Code;
    if (tech.includes('node') || tech.includes('express') || tech.includes('backend')) return Server;
    if (tech.includes('database') || tech.includes('sql') || tech.includes('mysql') || tech.includes('postgresql') || tech.includes('mongodb')) return Database;
    if (tech.includes('web') || tech.includes('html') || tech.includes('css') || tech.includes('frontend')) return Globe;
    if (tech.includes('mobile') || tech.includes('ios') || tech.includes('android') || tech.includes('flutter') || tech.includes('react native')) return Smartphone;
    if (tech.includes('cloud') || tech.includes('aws') || tech.includes('azure') || tech.includes('gcp')) return Cloud;
    if (tech.includes('security') || tech.includes('auth') || tech.includes('encryption')) return Shield;
    if (tech.includes('api') || tech.includes('rest') || tech.includes('graphql')) return Zap;
    if (tech.includes('python') || tech.includes('java') || tech.includes('c++') || tech.includes('programming')) return Cpu;

    // Icône par défaut
    return Laptop;
  };
  const {
    encryptedEmail
  } = useParams<{
    encryptedEmail: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [treatmentHistory, setTreatmentHistory] = useState<any[]>([]);
  const [showTraiterSidebar, setShowTraiterSidebar] = useState(false);
  const [showModifierSidebar, setShowModifierSidebar] = useState(false);
  const [showActionSidebar, setShowActionSidebar] = useState(false);
  const [defaultActionTab, setDefaultActionTab] = useState<'modifier' | 'traiter'>('modifier');
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Vérifier si le prospect est traité (existe dans prospects_traites)
  const isProspectTraite = React.useMemo(() => {
    if (!treatmentHistory || treatmentHistory.length === 0) return false;
    // Vérifier s'il y a au moins un traitement provenant de prospects_traites
    return treatmentHistory.some(treatment => treatment.isFromTraites === true);
  }, [treatmentHistory]);

  // Décrypter l'email depuis l'URL
  const email = React.useMemo(() => {
    if (!encryptedEmail) return '';
    return extractEmailFromUrl(encryptedEmail);
  }, [encryptedEmail]);

  useEffect(() => {
    // Configuration de la locale française pour moment.js
    moment.locale('fr');
    if (email) {
      fetchProspectDetails();
      fetchTreatmentHistory();
    }
  }, [email]);
  const fetchTreatmentHistory = async () => {
    if (!email) return;
    try {
      // Récupérer les assignments actifs, les prospects traités, les prospects à rappeler et les modifications en parallèle
      const [assignmentsResult, traitesResult, rappelerResult, modificationsResult] = await Promise.all([
        supabase.from('sales_assignments').select('*').eq('lead_email', email), 
        supabase.from('prospects_traites').select('*').eq('lead_email', email),
        supabase.from('prospects_a_rappeler').select('*').eq('lead_email', email),
        supabase.from('prospect_modifications').select('*').eq('lead_email', email)
      ]);
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (traitesResult.error) throw traitesResult.error;
      if (rappelerResult.error) throw rappelerResult.error;
      if (modificationsResult.error) throw modificationsResult.error;

      // Enrichir les assignments actifs avec les profiles
      const enrichedAssignments = await Promise.all((assignmentsResult.data || []).map(async assignment => {
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', assignment.sales_user_id).single();
        return {
          ...assignment,
          profiles: profile,
          isFromTraites: false,
          isFromRappeler: false,
          isFromModification: false,
          display_date: assignment.created_at
        };
      }));

      // Enrichir les prospects traités avec les profiles
      const enrichedTraites = await Promise.all((traitesResult.data || []).map(async traite => {
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', traite.sales_user_id).single();
        return {
          ...traite,
          profiles: profile,
          isFromTraites: true,
          isFromRappeler: false,
          isFromModification: false,
          display_date: traite.completed_at
        };
      }));

      // Enrichir les prospects à rappeler avec les profiles
      const enrichedRappeler = await Promise.all((rappelerResult.data || []).map(async rappel => {
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', rappel.sales_user_id).single();
        return {
          ...rappel,
          profiles: profile,
          isFromTraites: false,
          isFromRappeler: true,
          isFromModification: false,
          display_date: rappel.assigned_at
        };
      }));

      // Enrichir les modifications avec les profiles
      const enrichedModifications = await Promise.all((modificationsResult.data || []).map(async modification => {
        const {
          data: profile
        } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', modification.modified_by).single();
        return {
          ...modification,
          profiles: profile,
          isFromTraites: false,
          isFromRappeler: false,
          isFromModification: true,
          display_date: modification.modified_at
        };
      }));

      // Combiner et trier par date (plus récent en premier)
      const allHistory = [...enrichedAssignments, ...enrichedTraites, ...enrichedRappeler, ...enrichedModifications].sort((a, b) => {
        const dateA = new Date(a.display_date).getTime();
        const dateB = new Date(b.display_date).getTime();
        return dateB - dateA;
      });
      setTreatmentHistory(allHistory);
    } catch (error) {
      console.error('Error fetching treatment history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'historique des traitements",
        variant: "destructive"
      });
    }
  };
  const fetchProspectDetails = async () => {
    if (!email) {
      console.error('No email found from encrypted URL');
      navigate('/prospects');
      return;
    }
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('get-contact', {
        body: {
          email: email // Utiliser l'email décrypté
        }
      });
      if (error) throw error;
      if (data && data.success && data.data) {
        // Combiner toutes les données des différentes sources
        const combinedProspect: any = {
          email: email,
          // Utiliser l'email décrypté
          sources: data.data
        };
        // Fusionner les données des différentes sources
        data.data.forEach((contact: any) => {
          Object.keys(contact.data).forEach(key => {
            const value = contact.data[key];
            // On prend la valeur si elle n'est pas nulle/vide et qu'on n'a pas déjà une valeur non-nulle
            if (value !== null && value !== '' && value !== undefined) {
              if (!combinedProspect[key] || combinedProspect[key] === null || combinedProspect[key] === '' || combinedProspect[key] === undefined) {
                combinedProspect[key] = value;
              }
            }
          });
        });
        setProspect(combinedProspect);
      } else {
        toast({
          title: "Erreur",
          description: "Prospect non trouvé",
          variant: "destructive"
        });
        navigate('/prospects');
      }
    } catch (error) {
      console.error('Error fetching prospect details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du prospect",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  const getDisplayName = () => {
    const firstName = prospect?.first_name || prospect?.crm_firstname || prospect?.apollo_firstname;
    const lastName = prospect?.last_name || prospect?.crm_name || prospect?.apollo_lastname;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return prospect?.email || 'Utilisateur';
  };
  const getCompanyName = () => {
    return prospect?.company || prospect?.crm_company || prospect?.apollo_company || 'Non renseigné';
  };
  const getCity = () => {
    return prospect?.city || prospect?.crm_city || 'Non renseigné';
  };
  const getPhone = () => {
    return prospect?.mobile_phone || prospect?.crm_mobile || prospect?.apollo_mobile || prospect?.work_direct_phone || prospect?.apollo_phone || 'Non renseigné';
  };
  const getLinkedInUrl = () => {
    return prospect?.person_linkedin_url || prospect?.crm_linkedin_url || prospect?.apollo_linkedin_url;
  };
  const getWebsite = () => {
    return prospect?.website || prospect?.apollo_website;
  };
  if (loading) {
    return <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (!prospect) {
    return <div className="text-center py-12">
        <p className="text-muted-foreground">Prospect non trouvé</p>
        <Button onClick={() => navigate('/prospects')} className="mt-4">
          Retour aux prospects
        </Button>
      </div>;
  }
  return <div className="min-h-screen w-full relative overflow-hidden">
      <motion.div className="flex-1 p-6 space-y-6" animate={{
      marginRight: showActionSidebar ? '480px' : '0px' // 480px pour le sidebar plus large
    }} transition={{
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{prospect.email}</h1>
              <p className="text-muted-foreground">Contact CRM</p>
            </div>
            {isProspectTraite && <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200/80">
                Prospect Traité
              </Badge>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => {
            setDefaultActionTab('modifier');
            setShowActionSidebar(true);
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          {!isProspectTraite && <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
            setDefaultActionTab('traiter');
            setShowActionSidebar(true);
          }}>
              <FileText className="h-4 w-4 mr-2" />
              Traiter
            </Button>}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                {getInitials(prospect.first_name || prospect.crm_firstname || prospect.apollo_firstname, prospect.last_name || prospect.crm_name || prospect.apollo_lastname, prospect.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{prospect.email}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                <span>{getCompanyName()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{getCity()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Contacts - Contact Principal */}
      {prospect.sources?.find(s => s.source_table === 'crm_contacts') && <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">CRM Contacts - Contact Principal</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-success/10 text-success px-3 py-1.5 rounded-full w-fit">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Email:</span>
                  <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline text-sm">
                    {prospect.email}
                  </a>
                </div>
                {(prospect.first_name || prospect.crm_firstname || prospect.firstname) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Prénom:</span>
                    <span className="text-sm">{prospect.first_name || prospect.crm_firstname || prospect.firstname}</span>
                  </div>}
                {(prospect.last_name || prospect.crm_name || prospect.name) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Nom:</span>
                    <span className="text-sm">{prospect.last_name || prospect.crm_name || prospect.name}</span>
                  </div>}
                {getPhone() !== 'Non renseigné' && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Téléphone:</span>
                    <a href={`tel:${getPhone()}`} className="text-blue-600 hover:underline text-sm">
                      {getPhone()}
                    </a>
                  </div>}
                {(prospect.tel || prospect.crm_mobile || prospect.mobile || prospect.tel_pro) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Tél. fixe:</span>
                    <a href={`tel:${prospect.tel || prospect.crm_mobile || prospect.mobile || prospect.tel_pro}`} className="text-blue-600 hover:underline text-sm">
                      {prospect.tel || prospect.crm_mobile || prospect.mobile || prospect.tel_pro}
                    </a>
                  </div>}
                {(prospect.mobile || prospect.crm_mobile || prospect.mobile_phone) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Mobile:</span>
                    <a href={`tel:${prospect.mobile || prospect.crm_mobile || prospect.mobile_phone}`} className="text-blue-600 hover:underline text-sm">
                      {prospect.mobile || prospect.crm_mobile || prospect.mobile_phone}
                    </a>
                  </div>}
                {prospect.mobile_2 && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Mobile 2:</span>
                    <a href={`tel:${prospect.mobile_2}`} className="text-blue-600 hover:underline text-sm">
                      {prospect.mobile_2}
                    </a>
                  </div>}
                {prospect.tel_pro && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Tél. pro:</span>
                    <a href={`tel:${prospect.tel_pro}`} className="text-blue-600 hover:underline text-sm">
                      {prospect.tel_pro}
                    </a>
                  </div>}
                {prospect.address && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Adresse:</span>
                    <span className="text-sm">{prospect.address}</span>
                  </div>}
                {prospect.departement && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Département:</span>
                    <span className="text-sm">{prospect.departement}</span>
                  </div>}
              </CardContent>
            </Card>

            {/* Entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-warning/10 text-warning px-3 py-1.5 rounded-full w-fit">
                  <Building2 className="h-4 w-4" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Entreprise:</span>
                  <span className="text-sm">{getCompanyName()}</span>
                </div>
                {(prospect.industrie || prospect.industry || prospect.apollo_industry) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Industrie:</span>
                    <span className="text-sm">{prospect.industrie || prospect.industry || prospect.apollo_industry}</span>
                  </div>}
                {(prospect.nb_employees || prospect.apollo_nb_employees) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Nb employés:</span>
                    <span className="text-sm">{prospect.nb_employees || prospect.apollo_nb_employees}</span>
                  </div>}
                {prospect.linkedin_function && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Fonction LinkedIn:</span>
                    <span className="text-sm">{prospect.linkedin_function}</span>
                  </div>}
                {(prospect.company_website || prospect.website || prospect.apollo_website) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Site web:</span>
                    <a href={prospect.company_website || prospect.website || prospect.apollo_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {prospect.company_website || prospect.website || prospect.apollo_website}
                    </a>
                  </div>}
                {(prospect.linkedin_company_url || prospect.apollo_company_linkedin_url) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">LinkedIn entreprise:</span>
                    <a href={prospect.linkedin_company_url || prospect.apollo_company_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      LinkedIn entreprise
                    </a>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>}

      {/* Apollo Contacts - Données Additionnelles */}
      {prospect.sources?.find(s => s.source_table === 'apollo_contacts') && <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium">Apollo Contacts - Données Additionnelles</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations personnelles Apollo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-green-600/10 px-3 py-1.5 rounded-full w-fit text-green-500">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Email:</span>
                  <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline text-sm">
                    {prospect.email}
                  </a>
                </div>
                {prospect.apollo_firstname && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Prénom:</span>
                    <span className="text-sm">{prospect.apollo_firstname}</span>
                  </div>}
                {prospect.apollo_lastname && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Nom:</span>
                    <span className="text-sm">{prospect.apollo_lastname}</span>
                  </div>}
                {(prospect.title || prospect.apollo_title) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Titre:</span>
                    <span className="text-sm">{prospect.title || prospect.apollo_title}</span>
                  </div>}
                {prospect.apollo_seniority && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Ancienneté:</span>
                    <span className="text-sm">{prospect.apollo_seniority}</span>
                  </div>}
                {getLinkedInUrl() && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">URL LinkedIn personnel:</span>
                    <a href={getLinkedInUrl()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Profil LinkedIn
                    </a>
                  </div>}
              </CardContent>
            </Card>

            {/* Entreprise Apollo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit">
                  <Building2 className="h-4 w-4" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Entreprise:</span>
                  <span className="text-sm">{getCompanyName()}</span>
                </div>
                {(prospect.industry || prospect.apollo_industry) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Industrie:</span>
                    <span className="text-sm">{prospect.industry || prospect.apollo_industry}</span>
                  </div>}
                {getWebsite() && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Site web:</span>
                    <a href={getWebsite()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {getWebsite()}
                    </a>
                  </div>}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Ville entreprise:</span>
                  <span className="text-sm">{getCity()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Pays entreprise:</span>
                  <span className="text-sm">{prospect.country || 'France'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm bg-secondary/10 text-secondary px-3 py-1.5 rounded-full w-fit">
              <Phone className="h-4 w-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Ville:</span>
              <span className="text-sm">{getCity()}</span>
            </div>
            {(prospect.country || prospect.crm_country) && <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Pays:</span>
                <span className="text-sm">{prospect.country || prospect.crm_country}</span>
              </div>}
          </CardContent>
        </Card>

        {/* Autres informations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm bg-accent text-slate-500 px-3 py-1.5 rounded-full w-fit">
              <Mail className="h-4 w-4" />
              Autres informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prospect.apollo_email_status && <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">_email_unique:</span>
                <Badge variant={prospect.apollo_email_status === 'Verified' ? 'default' : 'secondary'} className="text-xs">
                  {prospect.apollo_email_status === 'Verified' ? 'Oui' : 'Non'}
                </Badge>
              </div>}
          </CardContent>
      </Card>
      </div>

      {/* Plateforme & Intégrations */}
      {(prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_contact_id || prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_account_id) && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm bg-warning/10 text-warning px-3 py-1.5 rounded-full w-fit">
              <Building2 className="h-4 w-4" />
              Plateforme & Intégrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_contact_id && <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">ID contact Apollo:</span>
                <span className="text-xs font-mono">{prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_contact_id}</span>
              </div>}
            {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_account_id && <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">ID compte Apollo:</span>
                <span className="text-xs font-mono">{prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.apollo_account_id}</span>
              </div>}
          </CardContent>
        </Card>}

      {/* Activité & Engagement */}
      {(prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_sent !== undefined || prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_open !== undefined || prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.replied !== undefined) && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2 text-sm bg-success/10 text-success px-3 py-1.5 rounded-full w-fit">
                 <Mail className="h-4 w-4" />
                 Activité & Engagement
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_sent !== undefined && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Email envoyé:</span>
                  <Badge variant={prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_sent ? 'default' : 'secondary'} className="text-xs">
                    {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_sent ? 'Oui' : 'Non'}
                  </Badge>
                </div>}
              {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_open !== undefined && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Email ouvert:</span>
                  <Badge variant={prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_open ? 'default' : 'secondary'} className="text-xs">
                    {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.email_open ? 'Oui' : 'Non'}
                  </Badge>
                </div>}
              {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.replied !== undefined && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Email répliqué:</span>
                  <Badge variant={prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.replied ? 'default' : 'secondary'} className="text-xs">
                    {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.replied ? 'Oui' : 'Non'}
                  </Badge>
                </div>}
              {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.demoed !== undefined && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Démo effectuée:</span>
                  <Badge variant={prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.demoed ? 'default' : 'secondary'} className="text-xs">
                    {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.demoed ? 'Oui' : 'Non'}
                  </Badge>
                </div>}
            </CardContent>
          </Card>

          {/* Statut & Suivi */}
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2 text-sm bg-danger/10 text-danger px-3 py-1.5 rounded-full w-fit">
                 <User className="h-4 w-4" />
                 Statut & Suivi
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.apollo_email_status && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Statut email:</span>
                  <Badge variant={prospect.apollo_email_status === 'Verified' ? 'default' : 'secondary'} className="text-xs">
                    {prospect.apollo_email_status}
                  </Badge>
                </div>}
              {prospect.apollo_stage && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Étape:</span>
                  <Badge variant="outline" className="text-xs">{prospect.apollo_stage}</Badge>
                </div>}
            </CardContent>
          </Card>
        </div>}

      {/* Informations techniques */}
      {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.technologies && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit">
              <Building2 className="h-4 w-4" />
              Informations techniques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-muted-foreground text-sm block mb-3">Technologies:</span>
              <div className="flex flex-wrap gap-2">
                {prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.technologies.split(',').map((tech: string, index: number) => {
                const TechIcon = getTechIcon(tech);
                return <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                        <TechIcon className="h-3 w-3" />
                        {tech.trim()}
                      </Badge>;
              })}
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Historique des traitements */}
      {treatmentHistory.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm bg-blue-500/10 px-3 py-1.5 rounded-full w-fit text-blue-500">
                <FileText className="h-4 w-4" />
                Historique des traitements ({treatmentHistory.length})
              </div>
              {treatmentHistory.length > 3 && <Button variant="ghost" size="sm" onClick={() => setShowAllHistory(!showAllHistory)} className="text-blue-500 hover:text-blue-600">
                  {showAllHistory ? 'Voir moins' : 'Voir plus'}
                </Button>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {(showAllHistory ? treatmentHistory : treatmentHistory.slice(0, 3)).map((treatment, index) => <motion.div key={treatment.id} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -20
            }} transition={{
              duration: 0.3,
              delay: index * 0.1
            }} className="border-l-2 border-blue-200 pl-4 pb-4 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={treatment.isFromTraites ? 'default' : treatment.isFromRappeler ? 'outline' : treatment.isFromModification ? 'outline' : 'secondary'} 
                          className={treatment.isFromRappeler ? 'text-xs bg-orange-100 text-orange-800 border-orange-200' : treatment.isFromModification ? 'text-xs bg-blue-100 text-blue-800 border-blue-200' : 'text-xs'}
                        >
                          {treatment.isFromTraites ? 'Traité' : treatment.isFromRappeler ? 'À rappeler' : treatment.isFromModification ? 'Modification' : treatment.custom_data?.status || treatment.status}
                        </Badge>
                        {treatment.boucle && <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                            Bouclé
                          </Badge>}
                        <span className="text-xs text-muted-foreground">
                          {moment(treatment.display_date || treatment.created_at).format('DD MMM YYYY, HH:mm')}
                        </span>
                      </div>
                      
                      {/* Notes pour les assignments actifs */}
                      {treatment.custom_data?.sales_note && !treatment.isFromTraites && !treatment.isFromRappeler && !treatment.isFromModification && <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Note :</strong> {treatment.custom_data.sales_note}
                        </p>}
                      
                      {/* Notes pour les prospects traités */}
                      {treatment.notes_sales && treatment.isFromTraites && <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Note :</strong> {treatment.notes_sales}
                        </p>}
                      
                      {/* Notes pour les prospects à rappeler */}
                      {treatment.notes_sales && treatment.isFromRappeler && <p className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                          <strong>Note :</strong> {treatment.notes_sales}
                        </p>}
                      
                      {/* Champs modifiés */}
                      {treatment.modified_fields && treatment.isFromModification && <div className="text-sm bg-blue-50 p-2 rounded">
                          <strong className="block mb-1">Champs modifiés :</strong>
                          <div className="space-y-1">
                            {Object.entries(treatment.modified_fields).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>}
                      
                      {/* Statut pour les prospects traités */}
                      {treatment.statut_prospect && treatment.isFromTraites && <div className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {treatment.statut_prospect}
                          </Badge>
                        </div>}
                      
                      {/* Statut pour les prospects à rappeler */}
                      {treatment.statut_prospect && treatment.isFromRappeler && <div className="text-xs">
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-800 border-orange-200">
                            {treatment.statut_prospect}
                          </Badge>
                        </div>}
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {treatment.custom_data?.action_date && !treatment.isFromTraites && !treatment.isFromRappeler && !treatment.isFromModification && <div>
                            <strong>Date d'action :</strong> {' '}
                            {moment(treatment.custom_data.action_date).fromNow()}
                          </div>}
                        {treatment.date_action && treatment.isFromTraites && <div>
                            <strong>Date d'action :</strong> {' '}
                            {moment(treatment.date_action).fromNow()}
                          </div>}
                        {treatment.date_action && treatment.isFromRappeler && <div>
                            <strong>Date d'action :</strong> {' '}
                            {moment(treatment.date_action).fromNow()}
                          </div>}
                        {treatment.custom_data?.callback_date && !treatment.isFromTraites && !treatment.isFromRappeler && !treatment.isFromModification && <div>
                            <strong>Date de rappel :</strong> {' '}
                            {moment(treatment.custom_data.callback_date).fromNow()}
                          </div>}
                        {treatment.callback_date && treatment.isFromRappeler && <div>
                            <strong>Date de rappel :</strong> {' '}
                            {moment(treatment.callback_date).fromNow()}
                          </div>}
                        {treatment.profiles && <div>
                            <strong>{treatment.isFromModification ? 'Modifié par' : 'Traité par'} :</strong> {' '}
                            {treatment.profiles.first_name} {treatment.profiles.last_name} 
                            ({treatment.profiles.email})
                          </div>}
                      </div>
                    </div>
                  </div>
                  {index < (showAllHistory ? treatmentHistory : treatmentHistory.slice(0, 3)).length - 1 && <hr className="mt-4 border-gray-200" />}
                </motion.div>)}
            </AnimatePresence>
          </CardContent>
        </Card>}

      {/* Dates importantes */}

      {/* Dates importantes */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-sm bg-orange-500/10 px-3 py-1.5 rounded-full w-fit text-orange-400">
             <User className="h-4 w-4" />
             Dates importantes
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.created_at && <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Date de création:</span>
              <span className="text-sm">{moment(prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.created_at).format('DD MMM YYYY, HH:mm')}</span>
            </div>}
          {prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.updated_at && <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Mise à jour il y a:</span>
              <span className="text-sm">{moment(prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.updated_at).format('DD MMM YYYY, HH:mm')}</span>
            </div>}
        </CardContent>
      </Card>
      </motion.div>
      
      {/* Sidebar Actions Prospect */}
      <AnimatePresence>
        {showActionSidebar && <ProspectActionSidebar prospect={prospect} prospectEmail={email} defaultTab={defaultActionTab} onSuccess={() => {
        fetchProspectDetails();
        fetchTreatmentHistory();
        setShowActionSidebar(false);
      }} onClose={() => setShowActionSidebar(false)} />}
      </AnimatePresence>
    </div>;
};
export default ProspectDetails;