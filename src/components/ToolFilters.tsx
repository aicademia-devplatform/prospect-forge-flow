import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Filter, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToolFilterValues {
  // Systeme.io
  systemeio_list?: string;
  systemeio_status?: string;
  
  // Brevo
  brevo_tag?: string;
  brevo_status?: string;
  brevo_unsuscribe?: boolean;
  brevo_open_number_min?: number;
  brevo_click_number_min?: number;
  
  // Zoho
  zoho_status?: string[];
  zoho_tag?: string;
  zoho_updated_by?: string;
  zoho_product_interest?: string;
  zoho_status_2?: string;
  
  // HubSpot
  hubspot_status?: string;
  hubspot_lead_status?: string;
  hubspot_life_cycle_phase?: string;
  hubspot_buy_role?: string;
  
  // Apollo
  apollo_status?: string;
  apollo_list?: string;
}

interface ToolFiltersProps {
  filters: ToolFilterValues;
  onFiltersChange: (filters: ToolFilterValues) => void;
  onReset: () => void;
  tableName: string;
  activeFilterCount: number;
}

interface ToolCounts {
  systemeio: number;
  brevo: number;
  zoho: number;
  hubspot: number;
  apollo: number;
}

const ToolFilters: React.FC<ToolFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  tableName,
  activeFilterCount
}) => {
  const [toolCounts, setToolCounts] = useState<ToolCounts>({
    systemeio: 0,
    brevo: 0,
    zoho: 0,
    hubspot: 0,
    apollo: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isTogglingManually, setIsTogglingManually] = useState(false);

  // Charger les compteurs au montage du composant
  useEffect(() => {
    const fetchToolCounts = async () => {
      if (tableName !== 'crm_contacts') return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('tool-counts', {
          body: { tableName }
        });

        if (error) {
          console.warn('Edge function tool-counts non déployée, utilisation de compteurs par défaut');
          setToolCounts({
            systemeio: 0,
            brevo: 0,
            zoho: 0,
            hubspot: 0,
            apollo: 0
          });
          setLoading(false);
          return;
        }
        
        if (data && data.counts) {
          setToolCounts(data.counts);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement des compteurs, utilisation de valeurs par défaut:', error);
        setToolCounts({
          systemeio: 0,
          brevo: 0,
          zoho: 0,
          hubspot: 0,
          apollo: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchToolCounts();
  }, [tableName]);

  // Synchroniser selectedTools avec les filtres actifs au montage et lors des changements
  useEffect(() => {
    // Ne pas synchroniser si on est en train de toggle manuellement
    if (isTogglingManually) return;
    
    const activeTools = new Set<string>();
    
    // Systeme.io
    if (filters.systemeio_list) activeTools.add('systemeio');
    
    // Brevo
    if (filters.brevo_tag || filters.brevo_unsuscribe || filters.brevo_open_number_min || filters.brevo_click_number_min) {
      activeTools.add('brevo');
    }
    
    // Zoho
    if (filters.zoho_tag || filters.zoho_status || filters.zoho_updated_by || filters.zoho_product_interest || filters.zoho_status_2) {
      activeTools.add('zoho');
    }
    
    // HubSpot
    if (filters.hubspot_lead_status || filters.hubspot_life_cycle_phase || filters.hubspot_buy_role) {
      activeTools.add('hubspot');
    }
    
    // Apollo
    if (filters.apollo_status || filters.apollo_list) {
      activeTools.add('apollo');
    }
    
    setSelectedTools(activeTools);
  }, [filters, isTogglingManually]); // Dépend des filtres pour se synchroniser automatiquement

  // Charger les options de filtres quand les outils sélectionnés changent
  useEffect(() => {
    const fetchFilterOptions = async (tools: string[]) => {
      if (tools.length === 0) {
        setFilterOptions({});
        return;
      }
      
      setLoadingOptions(true);
      try {
        const { data, error } = await supabase.functions.invoke('tool-filter-options', {
          body: { tableName: 'crm_contacts', tools }
        });

        if (error) {
          console.error('Erreur lors du chargement des options de filtres:', error);
          setFilterOptions({});
          return;
        }

        if (data && data.options) {
          setFilterOptions(data.options);
        }
      } catch (error) {
        console.error('Exception lors du chargement des options de filtres:', error);
        setFilterOptions({});
      } finally {
        setLoadingOptions(false);
      }
    };

    if (selectedTools.size > 0) {
      fetchFilterOptions(Array.from(selectedTools));
    } else {
      setFilterOptions({});
    }
  }, [selectedTools]);

  const updateFilter = (key: keyof ToolFilterValues, value: string | string[] | number | boolean | undefined) => {
    const newFilters: Record<string, any> = { ...filters };
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters as ToolFilterValues);
  };

  const toggleToolSelection = (tool: string) => {
    setIsTogglingManually(true);
    const newSelected = new Set(selectedTools);
    
    if (newSelected.has(tool)) {
      // Désélectionner l'outil : retirer de selectedTools ET supprimer TOUS les filtres de cet outil
      newSelected.delete(tool);
      
      // Créer un nouveau objet filters sans les filtres de cet outil
      const newFilters = { ...filters };
      
      // Supprimer tous les filtres associés à l'outil
      switch (tool) {
        case 'systemeio':
          delete newFilters.systemeio_list;
          break;
        case 'brevo':
          delete newFilters.brevo_tag;
          delete newFilters.brevo_unsuscribe;
          delete newFilters.brevo_open_number_min;
          delete newFilters.brevo_click_number_min;
          break;
        case 'zoho':
          delete newFilters.zoho_tag;
          delete newFilters.zoho_status;
          delete newFilters.zoho_updated_by;
          delete newFilters.zoho_product_interest;
          delete newFilters.zoho_status_2;
          break;
        case 'hubspot':
          delete newFilters.hubspot_lead_status;
          delete newFilters.hubspot_life_cycle_phase;
          delete newFilters.hubspot_buy_role;
          break;
        case 'apollo':
          delete newFilters.apollo_status;
          delete newFilters.apollo_list;
          break;
      }
      
      // Appliquer les nouveaux filtres en une seule fois
      onFiltersChange(newFilters);
    } else {
      // Sélectionner l'outil : ajouter à selectedTools ET activer le filtre wildcard
      newSelected.add(tool);
      
      // Activer le filtre wildcard associé
      switch (tool) {
        case 'systemeio':
          updateFilter('systemeio_list', '%');
          break;
        case 'brevo':
          updateFilter('brevo_tag', '%');
          break;
        case 'zoho':
          updateFilter('zoho_tag', '%');
          break;
        case 'hubspot':
          updateFilter('hubspot_lead_status', '%');
          break;
        case 'apollo':
          updateFilter('apollo_status', '%');
          break;
      }
    }
    
    setSelectedTools(newSelected);
    
    // Réactiver la synchronisation après un court délai
    setTimeout(() => {
      setIsTogglingManually(false);
    }, 100);
  };

  const renderToolFilters = (tool: string) => {
    const toolColors = {
      systemeio: 'blue',
      brevo: 'purple',
      zoho: 'green',
      hubspot: 'orange',
      apollo: 'indigo'
    };

    const color = toolColors[tool as keyof typeof toolColors] || 'gray';

    switch (tool) {
      case 'systemeio':
        return (
          <div key={tool} className={`p-4 border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-950/20 rounded-lg`}>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className={`text-${color}-600 dark:text-${color}-400`}>Systeme.io</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="systemeio_list">Liste</Label>
                <Select
                  value={filters.systemeio_list || 'all'}
                  onValueChange={(value) => updateFilter('systemeio_list', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les listes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les listes</SelectItem>
                    {filterOptions['systemeio_list']?.length > 0 ? (
                      filterOptions['systemeio_list'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'brevo':
        return (
          <div key={tool} className={`p-4 border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-950/20 rounded-lg`}>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className={`text-${color}-600 dark:text-${color}-400`}>Brevo</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="brevo_tag">Tag</Label>
                <Select
                  value={filters.brevo_tag || 'all'}
                  onValueChange={(value) => updateFilter('brevo_tag', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les tags</SelectItem>
                    {filterOptions['brevo_tag']?.length > 0 ? (
                      filterOptions['brevo_tag'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="brevo_unsuscribe"
                  checked={filters.brevo_unsuscribe || false}
                  onCheckedChange={(checked) => updateFilter('brevo_unsuscribe', checked as boolean)}
                />
                <Label htmlFor="brevo_unsuscribe" className="cursor-pointer">
                  Désabonné uniquement
                </Label>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="brevo_open_number_min">Ouvertures minimum</Label>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      {filters.brevo_open_number_min || 0}
                    </span>
                  </div>
                  <Slider
                    id="brevo_open_number_min"
                    min={0}
                    max={50}
                    step={1}
                    value={[filters.brevo_open_number_min || 0]}
                    onValueChange={(value) => updateFilter('brevo_open_number_min', value[0] === 0 ? undefined : value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>50+</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="brevo_click_number_min">Clics minimum</Label>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      {filters.brevo_click_number_min || 0}
                    </span>
                  </div>
                  <Slider
                    id="brevo_click_number_min"
                    min={0}
                    max={30}
                    step={1}
                    value={[filters.brevo_click_number_min || 0]}
                    onValueChange={(value) => updateFilter('brevo_click_number_min', value[0] === 0 ? undefined : value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>30+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'zoho':
        return (
          <div key={tool} className={`p-4 border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-950/20 rounded-lg`}>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className={`text-${color}-600 dark:text-${color}-400`}>Zoho</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="zoho_tag">Tag</Label>
                <Select
                  value={filters.zoho_tag || 'all'}
                  onValueChange={(value) => updateFilter('zoho_tag', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les tags</SelectItem>
                    {filterOptions['zoho_tag']?.length > 0 ? (
                      filterOptions['zoho_tag'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoho_updated_by">Mis à jour par</Label>
                <Select
                  value={filters.zoho_updated_by || 'all'}
                  onValueChange={(value) => updateFilter('zoho_updated_by', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les utilisateurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {filterOptions['zoho_updated_by']?.length > 0 ? (
                      filterOptions['zoho_updated_by'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoho_product_interest">Intérêt produit</Label>
                <Select
                  value={filters.zoho_product_interest || 'all'}
                  onValueChange={(value) => updateFilter('zoho_product_interest', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les produits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    {filterOptions['zoho_product_interest']?.length > 0 ? (
                      filterOptions['zoho_product_interest'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoho_status_2">Statut 2</Label>
                <Select
                  value={filters.zoho_status_2 || 'all'}
                  onValueChange={(value) => updateFilter('zoho_status_2', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {filterOptions['zoho_status_2']?.length > 0 ? (
                      filterOptions['zoho_status_2'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'hubspot':
        return (
          <div key={tool} className={`p-4 border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-950/20 rounded-lg`}>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className={`text-${color}-600 dark:text-${color}-400`}>HubSpot</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="hubspot_lead_status">Lead Status</Label>
                <Select
                  value={filters.hubspot_lead_status || 'all'}
                  onValueChange={(value) => updateFilter('hubspot_lead_status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {filterOptions['hubspot_lead_status']?.length > 0 ? (
                      filterOptions['hubspot_lead_status'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hubspot_life_cycle_phase">Phase cycle de vie</Label>
                <Select
                  value={filters.hubspot_life_cycle_phase || 'all'}
                  onValueChange={(value) => updateFilter('hubspot_life_cycle_phase', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les phases</SelectItem>
                    {filterOptions['hubspot_life_cycle_phase']?.length > 0 ? (
                      filterOptions['hubspot_life_cycle_phase'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hubspot_buy_role">Rôle d'achat</Label>
                <Select
                  value={filters.hubspot_buy_role || 'all'}
                  onValueChange={(value) => updateFilter('hubspot_buy_role', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {filterOptions['hubspot_buy_role']?.length > 0 ? (
                      filterOptions['hubspot_buy_role'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'apollo':
        return (
          <div key={tool} className={`p-4 border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-950/20 rounded-lg`}>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className={`text-${color}-600 dark:text-${color}-400`}>Apollo</span>
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apollo_status">Statut</Label>
                <Select
                  value={filters.apollo_status || 'all'}
                  onValueChange={(value) => updateFilter('apollo_status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {filterOptions['apollo_status']?.length > 0 ? (
                      filterOptions['apollo_status'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apollo_list">Liste</Label>
                <Select
                  value={filters.apollo_list || 'all'}
                  onValueChange={(value) => updateFilter('apollo_list', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les listes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les listes</SelectItem>
                    {filterOptions['apollo_list']?.length > 0 ? (
                      filterOptions['apollo_list'].map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune valeur disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres par Outils
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser ({activeFilterCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Badges de compteurs par outil - Cliquables pour filtrer ET afficher les filtres */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cliquez sur un badge pour filtrer les données et afficher les filtres avancés
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={filters.systemeio_list ? "default" : "secondary"} 
              className={`px-3 py-1.5 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${
                filters.systemeio_list ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-secondary/80'
              }`}
              onClick={() => toggleToolSelection('systemeio')}
            >
              Systeme.io ({loading ? '...' : toolCounts.systemeio.toLocaleString('fr-FR')})
              {filters.systemeio_list && <X className="h-3 w-3" />}
            </Badge>
            <Badge 
              variant={filters.brevo_tag || filters.brevo_unsuscribe || filters.brevo_open_number_min || filters.brevo_click_number_min ? "default" : "secondary"} 
              className={`px-3 py-1.5 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${
                filters.brevo_tag || filters.brevo_unsuscribe || filters.brevo_open_number_min || filters.brevo_click_number_min ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-secondary/80'
              }`}
              onClick={() => toggleToolSelection('brevo')}
            >
              Brevo ({loading ? '...' : toolCounts.brevo.toLocaleString('fr-FR')})
              {(filters.brevo_tag || filters.brevo_unsuscribe || filters.brevo_open_number_min || filters.brevo_click_number_min) && <X className="h-3 w-3" />}
            </Badge>
            <Badge 
              variant={filters.zoho_tag || filters.zoho_status || filters.zoho_updated_by || filters.zoho_product_interest || filters.zoho_status_2 ? "default" : "secondary"} 
              className={`px-3 py-1.5 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${
                filters.zoho_tag || filters.zoho_status || filters.zoho_updated_by || filters.zoho_product_interest || filters.zoho_status_2 ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-secondary/80'
              }`}
              onClick={() => toggleToolSelection('zoho')}
            >
              Zoho ({loading ? '...' : toolCounts.zoho.toLocaleString('fr-FR')})
              {(filters.zoho_tag || filters.zoho_status || filters.zoho_updated_by || filters.zoho_product_interest || filters.zoho_status_2) && <X className="h-3 w-3" />}
            </Badge>
            <Badge 
              variant={filters.hubspot_lead_status || filters.hubspot_life_cycle_phase || filters.hubspot_buy_role ? "default" : "secondary"} 
              className={`px-3 py-1.5 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${
                filters.hubspot_lead_status || filters.hubspot_life_cycle_phase || filters.hubspot_buy_role ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-secondary/80'
              }`}
              onClick={() => toggleToolSelection('hubspot')}
            >
              HubSpot ({loading ? '...' : toolCounts.hubspot.toLocaleString('fr-FR')})
              {(filters.hubspot_lead_status || filters.hubspot_life_cycle_phase || filters.hubspot_buy_role) && <X className="h-3 w-3" />}
            </Badge>
            <Badge 
              variant={filters.apollo_status || filters.apollo_list ? "default" : "secondary"} 
              className={`px-3 py-1.5 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 ${
                filters.apollo_status || filters.apollo_list ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-secondary/80'
              }`}
              onClick={() => toggleToolSelection('apollo')}
            >
              Apollo ({loading ? '...' : toolCounts.apollo.toLocaleString('fr-FR')})
              {(filters.apollo_status || filters.apollo_list) && <X className="h-3 w-3" />}
            </Badge>
          </div>
        </div>

        {/* Section animée des filtres spécifiques */}
        <AnimatePresence>
          {selectedTools.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="space-y-4 mt-6 pt-6 border-t">
                {loadingOptions && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Chargement des options...</span>
                  </div>
                )}
                {!loadingOptions && Array.from(selectedTools).map(tool => renderToolFilters(tool))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ToolFilters;
