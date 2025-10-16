import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Linkedin,
  Calendar,
  Hash,
  Users
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

interface UnifiedProspectDetailsProps {
  prospect: {
    email: string;
    firstname: string | null;
    lastname: string | null;
    name: string | null;
    company: string | null;
    mobile: string | null;
    tel: string | null;
    tel_pro: string | null;
    address: string | null;
    city: string | null;
    departement: string | null;
    country: string | null;
    linkedin_url: string | null;
    linkedin_company_url: string | null;
    company_website: string | null;
    industrie: string | null;
    nb_employees: number | null;
    title: string | null;
    sources: {
      crm: boolean;
      hubspot: boolean;
      apollo: boolean;
    };
    sourceData: {
      crm?: any;
      hubspot?: any;
      apollo?: any;
    };
    lastUpdated: string;
    sourceCount: number;
  };
}

const UnifiedProspectDetails: React.FC<UnifiedProspectDetailsProps> = ({ prospect }) => {
  const renderFieldRow = (icon: React.ReactNode, label: string, value: string | null | undefined) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm">{value}</p>
        </div>
      </div>
    );
  };

  const renderSourceData = (sourceData: any, sourceName: string, color: string) => {
    if (!sourceData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucune donnée disponible pour {sourceName}</p>
        </div>
      );
    }

    const fields = Object.entries(sourceData)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(([key, value]) => (
            <div key={key} className="border rounded-lg p-3 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-sm break-words">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Section Résumé */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {[prospect.firstname, prospect.lastname || prospect.name].filter(Boolean).join(' ') || 'Nom non disponible'}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {prospect.title && <span>{prospect.title}</span>}
                {prospect.title && prospect.company && <span> • </span>}
                {prospect.company && <span>{prospect.company}</span>}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {prospect.sources.crm && (
                <Badge className="bg-blue-500 text-white">CRM</Badge>
              )}
              {prospect.sources.hubspot && (
                <Badge className="bg-orange-500 text-white">HubSpot</Badge>
              )}
              {prospect.sources.apollo && (
                <Badge className="bg-purple-500 text-white">Apollo</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informations de contact */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Contact
              </h3>
              {renderFieldRow(<Mail className="h-4 w-4" />, 'Email', prospect.email)}
              {renderFieldRow(<Phone className="h-4 w-4" />, 'Mobile', prospect.mobile)}
              {renderFieldRow(<Phone className="h-4 w-4" />, 'Téléphone', prospect.tel)}
              {renderFieldRow(<Phone className="h-4 w-4" />, 'Téléphone Pro', prospect.tel_pro)}
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Localisation
              </h3>
              {renderFieldRow(<MapPin className="h-4 w-4" />, 'Adresse', prospect.address)}
              {renderFieldRow(<MapPin className="h-4 w-4" />, 'Ville', prospect.city)}
              {renderFieldRow(<MapPin className="h-4 w-4" />, 'Département', prospect.departement)}
              {renderFieldRow(<MapPin className="h-4 w-4" />, 'Pays', prospect.country)}
            </div>

            {/* Entreprise */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Entreprise
              </h3>
              {renderFieldRow(<Building2 className="h-4 w-4" />, 'Entreprise', prospect.company)}
              {renderFieldRow(<Briefcase className="h-4 w-4" />, 'Industrie', prospect.industrie)}
              {renderFieldRow(<Users className="h-4 w-4" />, 'Nombre d\'employés', prospect.nb_employees?.toString())}
              {renderFieldRow(<Globe className="h-4 w-4" />, 'Site Web', prospect.company_website)}
            </div>

            {/* Réseaux sociaux */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Réseaux & Liens
              </h3>
              {prospect.linkedin_url && (
                <div className="flex items-start gap-3 py-2">
                  <div className="text-muted-foreground mt-0.5">
                    <Linkedin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">LinkedIn Personnel</p>
                    <a 
                      href={prospect.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Voir le profil
                    </a>
                  </div>
                </div>
              )}
              {prospect.linkedin_company_url && (
                <div className="flex items-start gap-3 py-2">
                  <div className="text-muted-foreground mt-0.5">
                    <Linkedin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">LinkedIn Entreprise</p>
                    <a 
                      href={prospect.linkedin_company_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Voir la page
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Dernière mise à jour: {moment(prospect.lastUpdated).format('D MMM YYYY à HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>{prospect.sourceCount} source{prospect.sourceCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Données par source */}
      <Card>
        <CardHeader>
          <CardTitle>Données Détaillées par Source</CardTitle>
          <CardDescription>
            Consultez les informations brutes de chaque source de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={prospect.sources.crm ? 'crm' : prospect.sources.hubspot ? 'hubspot' : 'apollo'}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crm" disabled={!prospect.sources.crm}>
                <Database className="h-4 w-4 mr-2" />
                CRM
                {!prospect.sources.crm && <span className="ml-2 text-xs">(vide)</span>}
              </TabsTrigger>
              <TabsTrigger value="hubspot" disabled={!prospect.sources.hubspot}>
                <Database className="h-4 w-4 mr-2" />
                HubSpot
                {!prospect.sources.hubspot && <span className="ml-2 text-xs">(vide)</span>}
              </TabsTrigger>
              <TabsTrigger value="apollo" disabled={!prospect.sources.apollo}>
                <Database className="h-4 w-4 mr-2" />
                Apollo
                {!prospect.sources.apollo && <span className="ml-2 text-xs">(vide)</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crm" className="mt-6">
              {renderSourceData(prospect.sourceData.crm, 'CRM', 'blue')}
            </TabsContent>

            <TabsContent value="hubspot" className="mt-6">
              {renderSourceData(prospect.sourceData.hubspot, 'HubSpot', 'orange')}
            </TabsContent>

            <TabsContent value="apollo" className="mt-6">
              {renderSourceData(prospect.sourceData.apollo, 'Apollo', 'purple')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Légende de priorité */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Ordre de priorité des données</p>
              <p className="text-sm text-muted-foreground">
                Les champs affichés dans le résumé suivent l'ordre de priorité: 
                <span className="font-semibold"> CRM</span> &gt; 
                <span className="font-semibold"> HubSpot</span> &gt; 
                <span className="font-semibold"> Apollo</span>. 
                La première valeur non vide trouvée est utilisée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedProspectDetails;


