import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Phone, MapPin, Mail, ExternalLink, Edit } from 'lucide-react';
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
  apollo_website?: string;
  apollo_stage?: string;
  apollo_lists?: string;
  apollo_last_contacted?: string;
  apollo_status?: string;
  
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
}

const ProspectDetails: React.FC = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (email) {
      fetchProspectDetails();
    }
  }, [email]);

  const fetchProspectDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-contact', {
        body: { email: decodeURIComponent(email!) }
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
            if (contact.data[key] && !combinedProspect[key]) {
              combinedProspect[key] = contact.data[key];
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
    return (
      <div className="space-y-6">
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
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
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
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Prospect non trouvé</p>
        <Button onClick={() => navigate('/prospects')} className="mt-4">
          Retour aux prospects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/prospects')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{prospect.email}</h1>
            <p className="text-muted-foreground">Contact {prospect.data_source || 'CRM'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button size="sm">
            <User className="h-4 w-4 mr-2" />
            Assigner à un commercial
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">
                {getInitials(
                  prospect.first_name || prospect.crm_firstname || prospect.apollo_firstname,
                  prospect.last_name || prospect.crm_name || prospect.apollo_lastname,
                  prospect.email
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{getDisplayName()}</h2>
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

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <a href={`mailto:${prospect.email}`} className="text-primary hover:underline">
                {prospect.email}
              </a>
            </div>
            {(prospect.first_name || prospect.crm_firstname || prospect.apollo_firstname) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prénom:</span>
                <span>{prospect.first_name || prospect.crm_firstname || prospect.apollo_firstname}</span>
              </div>
            )}
            {(prospect.last_name || prospect.crm_name || prospect.apollo_lastname) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom:</span>
                <span>{prospect.last_name || prospect.crm_name || prospect.apollo_lastname}</span>
              </div>
            )}
            {(prospect.title || prospect.apollo_title) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titre:</span>
                <span>{prospect.title || prospect.apollo_title}</span>
              </div>
            )}
            {prospect.apollo_seniority && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ancienneté:</span>
                <span>{prospect.apollo_seniority}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entreprise:</span>
              <span>{getCompanyName()}</span>
            </div>
            {(prospect.industry || prospect.apollo_industry) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industrie:</span>
                <span>{prospect.industry || prospect.apollo_industry}</span>
              </div>
            )}
            {(prospect.nb_employees || prospect.apollo_nb_employees) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nb employés:</span>
                <span>{prospect.nb_employees || prospect.apollo_nb_employees}</span>
              </div>
            )}
            {prospect.apollo_departments && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Départements:</span>
                <span>{prospect.apollo_departments}</span>
              </div>
            )}
            {getWebsite() && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Site web:</span>
                <a href={getWebsite()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  Site web <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ville:</span>
              <span>{getCity()}</span>
            </div>
            {(prospect.country || prospect.crm_country) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pays:</span>
                <span>{prospect.country || prospect.crm_country}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléphone:</span>
              <span>{getPhone()}</span>
            </div>
            {getLinkedInUrl() && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">LinkedIn:</span>
                <a href={getLinkedInUrl()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  Profil <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Autres informations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Autres informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prospect.zoho_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut Zoho:</span>
                <Badge variant="outline">{prospect.zoho_status}</Badge>
              </div>
            )}
            {prospect.apollo_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut Apollo:</span>
                <Badge variant="outline">{prospect.apollo_status}</Badge>
              </div>
            )}
            {prospect.apollo_email_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut Email:</span>
                <Badge variant="outline">{prospect.apollo_email_status}</Badge>
              </div>
            )}
            {prospect.apollo_stage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Étape:</span>
                <Badge variant="outline">{prospect.apollo_stage}</Badge>
              </div>
            )}
            {prospect.apollo_lists && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listes:</span>
                <span className="text-sm">{prospect.apollo_lists}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Apollo Data Section */}
      {prospect.apollo_id && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Apollo Contacts - Données Additionnelles</h3>
            <Badge variant="secondary">Apollo</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations Apollo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations Apollo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prospect.apollo_contact_owner && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Propriétaire contact:</span>
                    <span>{prospect.apollo_contact_owner}</span>
                  </div>
                )}
                {prospect.apollo_last_contacted && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernier contact:</span>
                    <span>{new Date(prospect.apollo_last_contacted).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Apollo:</span>
                  <span className="text-xs font-mono">{prospect.apollo_id}</span>
                </div>
              </CardContent>
            </Card>

            {/* Données techniques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Données techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source de données:</span>
                  <Badge variant="outline">{prospect.data_source || 'Apollo'}</Badge>
                </div>
                {prospect.apollo_email_status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut email vérifié:</span>
                    <Badge variant={prospect.apollo_email_status === 'verified' ? 'default' : 'secondary'}>
                      {prospect.apollo_email_status}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectDetails;