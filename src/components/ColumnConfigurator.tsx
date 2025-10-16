import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Columns, RefreshCw } from 'lucide-react';

interface ColumnConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (config: ColumnConfig) => void;
}

export interface ColumnConfig {
  crm: string[];
  hubspot: string[];
  apollo: string[];
}

const DEFAULT_CRM_COLUMNS = [
  'email', 'firstname', 'name', 'company', 'mobile', 'tel', 
  'zoho_status', 'data_section', 'city', 'industrie'
];

const DEFAULT_HUBSPOT_COLUMNS = [
  'lifecyclestage', 'hs_lead_status', 'hs_pipeline', 'hs_analytics_revenue'
];

const DEFAULT_APOLLO_COLUMNS = [
  'email_status', 'stage', 'lists', 'seniority'
];

const ALL_CRM_COLUMNS = [
  'email', 'firstname', 'name', 'company', 'mobile', 'tel', 'tel_pro',
  'address', 'city', 'departement', 'country', 'linkedin_url',
  'linkedin_company_url', 'company_website', 'industrie', 'nb_employees',
  'zoho_status', 'apollo_status', 'data_section', 'linkedin_function',
  'mobile_2', 'full_name', 'contact_active'
];

const ALL_HUBSPOT_COLUMNS = [
  'lifecyclestage', 'hs_lead_status', 'hs_pipeline', 'hs_analytics_revenue',
  'hs_analytics_num_visits', 'hs_analytics_num_page_views', 'hs_latest_source',
  'notes_last_contacted', 'notes_last_updated'
];

const ALL_APOLLO_COLUMNS = [
  'email_status', 'stage', 'lists', 'seniority', 'departments',
  'title', 'industry', 'num_employees', 'annual_revenue',
  'technologies', 'keywords'
];

const COLUMN_LABELS: Record<string, string> = {
  // CRM
  'email': 'Email',
  'firstname': 'Prénom',
  'name': 'Nom',
  'company': 'Entreprise',
  'mobile': 'Mobile',
  'tel': 'Téléphone',
  'tel_pro': 'Téléphone Pro',
  'address': 'Adresse',
  'city': 'Ville',
  'departement': 'Département',
  'country': 'Pays',
  'linkedin_url': 'LinkedIn',
  'linkedin_company_url': 'LinkedIn Entreprise',
  'company_website': 'Site Web',
  'industrie': 'Industrie',
  'nb_employees': 'Nb Employés',
  'zoho_status': 'Statut Zoho',
  'apollo_status': 'Statut Apollo',
  'data_section': 'Section Données',
  'linkedin_function': 'Fonction LinkedIn',
  'mobile_2': 'Mobile 2',
  'full_name': 'Nom Complet',
  'contact_active': 'Contact Actif',
  
  // HubSpot
  'lifecyclestage': 'Lifecycle Stage',
  'hs_lead_status': 'Lead Status',
  'hs_pipeline': 'Pipeline',
  'hs_analytics_revenue': 'Revenue',
  'hs_analytics_num_visits': 'Nb Visites',
  'hs_analytics_num_page_views': 'Nb Pages Vues',
  'hs_latest_source': 'Dernière Source',
  'notes_last_contacted': 'Dernier Contact',
  'notes_last_updated': 'Dernière MAJ',
  
  // Apollo
  'email_status': 'Statut Email',
  'stage': 'Stage',
  'lists': 'Listes',
  'seniority': 'Ancienneté',
  'departments': 'Départements',
  'title': 'Titre',
  'industry': 'Industrie',
  'num_employees': 'Nb Employés',
  'annual_revenue': 'CA Annuel',
  'technologies': 'Technologies',
  'keywords': 'Mots-clés',
};

const ColumnConfigurator: React.FC<ColumnConfiguratorProps> = ({
  open,
  onOpenChange,
  onApply,
}) => {
  const [config, setConfig] = useState<ColumnConfig>({
    crm: DEFAULT_CRM_COLUMNS,
    hubspot: DEFAULT_HUBSPOT_COLUMNS,
    apollo: DEFAULT_APOLLO_COLUMNS,
  });

  // Charger la config depuis localStorage au montage
  useEffect(() => {
    const savedConfig = localStorage.getItem('unified_crm_columns_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading column config:', error);
      }
    }
  }, []);

  const handleToggleColumn = (source: keyof ColumnConfig, column: string) => {
    setConfig(prev => {
      const sourceColumns = prev[source];
      const newColumns = sourceColumns.includes(column)
        ? sourceColumns.filter(c => c !== column)
        : [...sourceColumns, column];
      
      return {
        ...prev,
        [source]: newColumns,
      };
    });
  };

  const handleReset = () => {
    setConfig({
      crm: DEFAULT_CRM_COLUMNS,
      hubspot: DEFAULT_HUBSPOT_COLUMNS,
      apollo: DEFAULT_APOLLO_COLUMNS,
    });
  };

  const handleApply = () => {
    // Sauvegarder dans localStorage
    localStorage.setItem('unified_crm_columns_config', JSON.stringify(config));
    onApply(config);
    onOpenChange(false);
  };

  const renderColumnList = (
    source: keyof ColumnConfig,
    allColumns: string[],
    label: string,
    badgeColor: string
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={badgeColor}>
              {config[source].length} / {allColumns.length} colonnes
            </Badge>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-2">
            {allColumns.map(column => (
              <div key={column} className="flex items-center space-x-2">
                <Checkbox
                  id={`${source}-${column}`}
                  checked={config[source].includes(column)}
                  onCheckedChange={() => handleToggleColumn(source, column)}
                />
                <Label
                  htmlFor={`${source}-${column}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {COLUMN_LABELS[column] || column}
                  <span className="text-xs text-muted-foreground ml-2">({column})</span>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns className="h-5 w-5" />
            Configuration des colonnes par source
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les colonnes à afficher pour chaque source de données
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="crm" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crm">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 mr-2">CRM</Badge>
              {config.crm.length}
            </TabsTrigger>
            <TabsTrigger value="hubspot">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 mr-2">HubSpot</Badge>
              {config.hubspot.length}
            </TabsTrigger>
            <TabsTrigger value="apollo">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 mr-2">Apollo</Badge>
              {config.apollo.length}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crm">
            {renderColumnList('crm', ALL_CRM_COLUMNS, 'Colonnes CRM', 'bg-blue-100 text-blue-700')}
          </TabsContent>

          <TabsContent value="hubspot">
            {renderColumnList('hubspot', ALL_HUBSPOT_COLUMNS, 'Colonnes HubSpot', 'bg-orange-100 text-orange-700')}
          </TabsContent>

          <TabsContent value="apollo">
            {renderColumnList('apollo', ALL_APOLLO_COLUMNS, 'Colonnes Apollo', 'bg-purple-100 text-purple-700')}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleApply}>
              Appliquer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnConfigurator;


