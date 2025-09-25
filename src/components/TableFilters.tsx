import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface FilterValues {
  dateCreatedFrom?: Date;
  dateCreatedTo?: Date;
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtres avancés</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs"
            >
              {isCollapsed ? 'Afficher' : 'Masquer'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Date filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de création (de)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.dateCreatedFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateCreatedFrom 
                      ? format(localFilters.dateCreatedFrom, "dd MMM yyyy", { locale: fr })
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateCreatedFrom}
                    onSelect={(date) => updateFilter('dateCreatedFrom', date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de création (à)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.dateCreatedTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateCreatedTo 
                      ? format(localFilters.dateCreatedTo, "dd MMM yyyy", { locale: fr })
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateCreatedTo}
                    onSelect={(date) => updateFilter('dateCreatedTo', date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Select filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section de données</label>
              <Select value={localFilters.dataSection || ""} onValueChange={(value) => updateFilter('dataSection', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les sections</SelectItem>
                  <SelectItem value="Arlynk">Arlynk</SelectItem>
                  <SelectItem value="Aicademia">Aicademia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut Zoho</label>
              <Select value={localFilters.zohoStatus || ""} onValueChange={(value) => updateFilter('zohoStatus', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  {ZOHO_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut Apollo</label>
              <Select value={localFilters.apolloStatus || ""} onValueChange={(value) => updateFilter('apolloStatus', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  {APOLLO_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact actif</label>
              <Select value={localFilters.contactActive || ""} onValueChange={(value) => updateFilter('contactActive', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les contacts</SelectItem>
                  {CONTACT_ACTIVE_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industrie</label>
              <Select value={localFilters.industrie || ""} onValueChange={(value) => updateFilter('industrie', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les industries</SelectItem>
                  {INDUSTRIE_OPTIONS.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entreprise</label>
              <Input
                placeholder="Nom de l'entreprise"
                value={localFilters.company || ""}
                onChange={(e) => updateFilter('company', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtres actifs</label>
              <div className="flex flex-wrap gap-2">
                {localFilters.dateCreatedFrom && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date de: {format(localFilters.dateCreatedFrom, "dd/MM/yyyy", { locale: fr })}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('dateCreatedFrom')} />
                  </Badge>
                )}
                {localFilters.dateCreatedTo && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date à: {format(localFilters.dateCreatedTo, "dd/MM/yyyy", { locale: fr })}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('dateCreatedTo')} />
                  </Badge>
                )}
                {localFilters.dataSection && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Section: {localFilters.dataSection}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('dataSection')} />
                  </Badge>
                )}
                {localFilters.zohoStatus && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Zoho: {localFilters.zohoStatus}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('zohoStatus')} />
                  </Badge>
                )}
                {localFilters.apolloStatus && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Apollo: {localFilters.apolloStatus}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('apolloStatus')} />
                  </Badge>
                )}
                {localFilters.contactActive && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Actif: {localFilters.contactActive}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('contactActive')} />
                  </Badge>
                )}
                {localFilters.industrie && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Industrie: {localFilters.industrie}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('industrie')} />
                  </Badge>
                )}
                {localFilters.company && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Entreprise: {localFilters.company}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('company')} />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TableFilters;