import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Phone, MapPin, Mail, ExternalLink, Edit, FileText } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TraiterProspectSidebar } from '@/components/TraiterProspectSidebar';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

  // Sources data
  sources?: Array<{
    source_table: string;
    data: any;
  }>;
}
const ProspectDetails: React.FC = () => {
  const {
    email
  } = useParams<{
    email: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTraiterSidebar, setShowTraiterSidebar] = useState(false);
  useEffect(() => {
    if (email) {
      fetchProspectDetails();
    }
  }, [email]);
  const fetchProspectDetails = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('get-contact', {
        body: {
          email: decodeURIComponent(email!)
        }
      });
      if (error) throw error;
      if (data && data.success && data.data) {
        // Combiner toutes les données des différentes sources
        const combinedProspect: any = {
          email: decodeURIComponent(email!),
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
  
  return (
    <div className="min-h-screen w-full relative">
      <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/prospects')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{prospect.email}</h1>
            <p className="text-muted-foreground">Contact CRM</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowTraiterSidebar(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Traiter
          </Button>
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
                {(prospect.first_name || prospect.crm_firstname) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Prénom:</span>
                    <span className="text-sm">{prospect.first_name || prospect.crm_firstname}</span>
                  </div>}
                {(prospect.last_name || prospect.crm_name) && <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Nom:</span>
                    <span className="text-sm">{prospect.last_name || prospect.crm_name}</span>
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
              <span className="text-muted-foreground text-sm block mb-2">Technologies:</span>
              <p className="text-sm leading-relaxed">{prospect.sources?.find(s => s.source_table === 'apollo_contacts')?.data.technologies}</p>
            </div>
          </CardContent>
        </Card>}

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
              <span className="text-sm">{new Date(prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.created_at).toLocaleDateString('fr-FR')}</span>
            </div>}
          {prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.updated_at && <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Mise à jour il y a:</span>
              <span className="text-sm">{new Date(prospect.sources?.find(s => s.source_table === 'crm_contacts')?.data.updated_at).toLocaleDateString('fr-FR')}</span>
            </div>}
        </CardContent>
      </Card>
        {/* Sidebar Traiter Prospect */}
        <AnimatePresence>
          {showTraiterSidebar && (
            <TraiterProspectSidebar
              prospectEmail={prospect.email}
              onSuccess={() => {
                fetchProspectDetails();
                setShowTraiterSidebar(false);
              }}
              onClose={() => setShowTraiterSidebar(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default ProspectDetails;