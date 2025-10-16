import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Database, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { StatusFilters } from '@/hooks/useUnifiedCRMData';

interface UnifiedCRMFiltersProps {
  sourceFilters: ('crm' | 'hubspot' | 'apollo')[];
  onSourceFiltersChange: (filters: ('crm' | 'hubspot' | 'apollo')[]) => void;
  statusFilters: StatusFilters;
  onStatusFiltersChange: (filters: StatusFilters) => void;
  onReset: () => void;
  activeFilterCount: number;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const UnifiedCRMFilters: React.FC<UnifiedCRMFiltersProps> = ({
  sourceFilters,
  onSourceFiltersChange,
  statusFilters,
  onStatusFiltersChange,
  onReset,
  activeFilterCount,
  isExpanded = false,
  onExpandedChange
}) => {
  
  const handleSourceToggle = (source: 'crm' | 'hubspot' | 'apollo') => {
    if (sourceFilters.includes(source)) {
      onSourceFiltersChange(sourceFilters.filter(s => s !== source));
    } else {
      onSourceFiltersChange([...sourceFilters, source]);
    }
  };

  const handleStatusFilterChange = (category: keyof StatusFilters, value: string) => {
    if (!value || value === 'all') {
      // Retirer le filtre
      const newFilters = { ...statusFilters };
      delete newFilters[category];
      onStatusFiltersChange(newFilters);
    } else {
      onStatusFiltersChange({
        ...statusFilters,
        [category]: [value]
      });
    }
  };

  // Valeurs des statuts (à adapter selon vos données réelles)
  const zohoStatusOptions = [
    'Prospect chaud',
    'Prospect tiède',
    'Prospect froid',
    'Suspect chaud',
    'Suspect tiede',
    'Prospect chaud à relancer',
    'Client',
    'Partenaire'
  ];

  const apolloStatusOptions = [
    'Contacté',
    'Qualifié',
    'Non qualifié',
    'En cours',
    'Fermé'
  ];

  const dataSectionOptions = [
    'Apollo',
    'HubSpot',
    'CRM',
    'Import manuel',
    'Autre'
  ];

  const lifecycleStageOptions = [
    'lead',
    'marketingqualifiedlead',
    'salesqualifiedlead',
    'opportunity',
    'customer',
    'evangelist',
    'other'
  ];

  const hsLeadStatusOptions = [
    'NEW',
    'OPEN',
    'IN_PROGRESS',
    'OPEN_DEAL',
    'UNQUALIFIED',
    'ATTEMPTED_TO_CONTACT',
    'CONNECTED',
    'BAD_TIMING'
  ];

  const emailStatusOptions = [
    'Verified',
    'Unverified',
    'Guessed',
    'Unavailable',
    'Bounced'
  ];

  const stageOptions = [
    'Lead',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost'
  ];

  return (
    <Card className="border-l-4 border-l-orange-500/20">
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Header with chevron button */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1" 
            onClick={() => onExpandedChange?.(!isExpanded)}
          >
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres par source de données et statuts
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilterCount}</Badge>
              )}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 ml-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={onReset} className="h-8 px-3 text-xs">
              <X className="h-3 w-3 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              style={{ overflow: "hidden" }}
            >
              <div className="space-y-6 mt-4">
              {/* Section Sources de données */}
              <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sources de données
          </Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="source-crm"
                checked={sourceFilters.includes('crm')}
                onCheckedChange={() => handleSourceToggle('crm')}
              />
              <Label htmlFor="source-crm" className="cursor-pointer flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">CRM</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="source-hubspot"
                checked={sourceFilters.includes('hubspot')}
                onCheckedChange={() => handleSourceToggle('hubspot')}
              />
              <Label htmlFor="source-hubspot" className="cursor-pointer flex items-center gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">HubSpot</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="source-apollo"
                checked={sourceFilters.includes('apollo')}
                onCheckedChange={() => handleSourceToggle('apollo')}
              />
              <Label htmlFor="source-apollo" className="cursor-pointer flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Apollo</Badge>
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtres Statuts CRM */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Statuts CRM</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zoho-status" className="text-xs text-muted-foreground">
                Statut Zoho
              </Label>
              <Select
                value={statusFilters.zoho_status?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('zoho_status', value)}
              >
                <SelectTrigger id="zoho-status">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {zohoStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apollo-status" className="text-xs text-muted-foreground">
                Statut Apollo (CRM)
              </Label>
              <Select
                value={statusFilters.apollo_status?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('apollo_status', value)}
              >
                <SelectTrigger id="apollo-status">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {apolloStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-section" className="text-xs text-muted-foreground">
                Section Données
              </Label>
              <Select
                value={statusFilters.data_section?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('data_section', value)}
              >
                <SelectTrigger id="data-section">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {dataSectionOptions.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtres Statuts HubSpot */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Statuts HubSpot</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lifecycle-stage" className="text-xs text-muted-foreground">
                Lifecycle Stage
              </Label>
              <Select
                value={statusFilters.lifecyclestage?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('lifecyclestage', value)}
              >
                <SelectTrigger id="lifecycle-stage">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {lifecycleStageOptions.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hs-lead-status" className="text-xs text-muted-foreground">
                Lead Status
              </Label>
              <Select
                value={statusFilters.hs_lead_status?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('hs_lead_status', value)}
              >
                <SelectTrigger id="hs-lead-status">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {hsLeadStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtres Statuts Apollo */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Statuts Apollo</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-status" className="text-xs text-muted-foreground">
                Email Status
              </Label>
              <Select
                value={statusFilters.email_status?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('email_status', value)}
              >
                <SelectTrigger id="email-status">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {emailStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage" className="text-xs text-muted-foreground">
                Stage
              </Label>
              <Select
                value={statusFilters.stage?.[0] || 'all'}
                onValueChange={(value) => handleStatusFilterChange('stage', value)}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {stageOptions.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default UnifiedCRMFilters;

