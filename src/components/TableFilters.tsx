import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

export interface FilterValues {
  dateRange?: DateRange;
  dataSection?: string;
  zohoStatus?: string;
  apolloStatus?: string;
  contactActive?: string;
  industrie?: string;
  company?: string;
}

interface TableFiltersProps {
  tableName: 'apollo_contacts' | 'crm_contacts';
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
}

const ZOHO_STATUS_OPTIONS = [
  'Lead',
  'Prospect',
  'Customer',
  'Partner',
  'Inactive',
  'Cold Lead',
  'Warm Lead',
  'Hot Lead'
];

const APOLLO_STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'Engaged',
  'Not Contacted',
  'Replied',
  'Bounced',
  'Unsubscribed'
];

const CONTACT_ACTIVE_OPTIONS = [
  'Oui',
  'Non',
  'En cours'
];

const INDUSTRIE_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Real Estate',
  'Marketing',
  'Other'
];

const TableFilters: React.FC<TableFiltersProps> = ({
  tableName,
  filters,
  onFiltersChange,
  onReset
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);
  const [isOpen, setIsOpen] = useState(false);

  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof FilterValues) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Only show filters for crm_contacts table
  if (tableName !== 'crm_contacts') {
    return null;
  }

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between transition-all duration-200 hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtres avancés</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 animate-scale-in">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset();
                  }}
                  className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <Card className="mt-2 border-l-4 border-l-primary/20">
            <CardContent className="pt-6 space-y-6">
              {/* Date range filter */}
              <div className="space-y-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <label className="text-sm font-medium text-foreground/80">Période de création</label>
                <DateRangePicker
                  dateRange={localFilters.dateRange}
                  onDateRangeChange={(range) => updateFilter('dateRange', range)}
                  placeholder="Sélectionner une période de création"
                />
              </div>

              {/* Select filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Section de données</label>
                  <Select value={localFilters.dataSection || "all"} onValueChange={(value) => updateFilter('dataSection', value === "all" ? undefined : value)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Toutes les sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sections</SelectItem>
                      <SelectItem value="Arlynk">Arlynk</SelectItem>
                      <SelectItem value="Aicademia">Aicademia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Statut Zoho</label>
                  <Select value={localFilters.zohoStatus || "all"} onValueChange={(value) => updateFilter('zohoStatus', value === "all" ? undefined : value)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {ZOHO_STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Statut Apollo</label>
                  <Select value={localFilters.apolloStatus || "all"} onValueChange={(value) => updateFilter('apolloStatus', value === "all" ? undefined : value)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {APOLLO_STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Contact actif</label>
                  <Select value={localFilters.contactActive || "all"} onValueChange={(value) => updateFilter('contactActive', value === "all" ? undefined : value)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Tous les contacts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les contacts</SelectItem>
                      {CONTACT_ACTIVE_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Industrie</label>
                  <Select value={localFilters.industrie || "all"} onValueChange={(value) => updateFilter('industrie', value === "all" ? undefined : value)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Toutes les industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les industries</SelectItem>
                      {INDUSTRIE_OPTIONS.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Entreprise</label>
                  <Input
                    placeholder="Nom de l'entreprise"
                    value={localFilters.company || ""}
                    onChange={(e) => updateFilter('company', e.target.value || undefined)}
                    className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <label className="text-sm font-medium text-foreground/80">Filtres actifs</label>
                  <div className="flex flex-wrap gap-2">
                    {localFilters.dateRange?.from && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Période: {format(localFilters.dateRange.from, "dd/MM/yyyy", { locale: fr })}
                        {localFilters.dateRange.to && ` - ${format(localFilters.dateRange.to, "dd/MM/yyyy", { locale: fr })}`}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('dateRange')} />
                      </Badge>
                    )}
                    {localFilters.dataSection && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Section: {localFilters.dataSection}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('dataSection')} />
                      </Badge>
                    )}
                    {localFilters.zohoStatus && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Zoho: {localFilters.zohoStatus}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('zohoStatus')} />
                      </Badge>
                    )}
                    {localFilters.apolloStatus && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Apollo: {localFilters.apolloStatus}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('apolloStatus')} />
                      </Badge>
                    )}
                    {localFilters.contactActive && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Actif: {localFilters.contactActive}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('contactActive')} />
                      </Badge>
                    )}
                    {localFilters.industrie && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Industrie: {localFilters.industrie}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('industrie')} />
                      </Badge>
                    )}
                    {localFilters.company && (
                      <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                        Entreprise: {localFilters.company}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('company')} />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TableFilters;