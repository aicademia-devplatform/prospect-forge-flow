import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Filter, X, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

export interface FilterValues {
  dateRange?: DateRange;
  dataSection?: string | string[];
  zohoStatus?: string;
  apolloStatus?: string;
  contactActive?: string;
  industrie?: string;
  company?: string;
  // Apollo specific filters
  emailStatus?: string;
  seniority?: string;
  stage?: string;
  nbEmployees?: string;
  departments?: string;
  contactOwner?: string;
  lists?: string;
}

interface TableFiltersProps {
  tableName: 'apollo_contacts' | 'crm_contacts';
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  showOnlyButton?: boolean;
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

// Apollo specific options
const EMAIL_STATUS_OPTIONS = [
  'verified',
  'unverified',
  'catchall',
  'bounced',
  'invalid',
  'risky'
];

const SENIORITY_OPTIONS = [
  'C-Level',
  'VP',
  'Director',
  'Manager',
  'Senior',
  'Entry Level',
  'Intern'
];

const STAGE_OPTIONS = [
  'Lead',
  'Prospect',
  'Opportunity',
  'Customer',
  'Closed Won',
  'Closed Lost'
];

const NB_EMPLOYEES_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+'
];

const DEPARTMENTS_OPTIONS = [
  'Sales',
  'Marketing',
  'Engineering',
  'Finance',
  'HR',
  'Operations',
  'IT',
  'Customer Success',
  'Product',
  'Legal'
];

const TableFilters: React.FC<TableFiltersProps> = ({
  tableName,
  filters,
  onFiltersChange,
  onReset,
  isOpen = false,
  onToggle,
  showOnlyButton = false
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

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

  // Show filters for both tables
  if (tableName !== 'crm_contacts' && tableName !== 'apollo_contacts') {
    return null;
  }

  const activeFilterCount = Object.keys(filters).length;

  // Si on veut seulement le bouton, on retourne juste le bouton
  if (showOnlyButton) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="h-9 px-3 justify-start gap-2 transition-all duration-200 hover:bg-accent/50"
      >
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filtres</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs animate-scale-in">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <motion.div 
      className="mb-2"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.04, 0.62, 0.23, 0.98] 
      }}
      style={{ overflow: "hidden" }}
    >
      <Card className="border-l-4 border-l-primary/20">
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Header with chevron button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Filtres avancés</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200"
            >
              <ChevronUp className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </div>
          
          {/* Reset button */}
          {hasActiveFilters && (
            <div className="flex justify-end animate-fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            </div>
          )}
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
            {tableName === 'crm_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Section de données</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {['Arlynk', 'Aicademia'].map((section) => {
                      const isSelected = Array.isArray(localFilters.dataSection) 
                        ? localFilters.dataSection.includes(section)
                        : localFilters.dataSection === section;
                      
                      return (
                        <Badge
                          key={section}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                          }`}
                          onClick={() => {
                            const currentSections = Array.isArray(localFilters.dataSection) 
                              ? localFilters.dataSection 
                              : localFilters.dataSection ? [localFilters.dataSection] : [];
                            
                            let newSections;
                            if (isSelected) {
                              newSections = currentSections.filter(s => s !== section);
                            } else {
                              newSections = [...currentSections, section];
                            }
                            
                            updateFilter('dataSection', newSections.length > 0 ? newSections : undefined);
                          }}
                        >
                          {section}
                          {isSelected && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                  {(Array.isArray(localFilters.dataSection) ? localFilters.dataSection.length > 0 : localFilters.dataSection) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('dataSection', undefined)}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Effacer tout
                    </Button>
                  )}
                </div>
              </div>
            )}

            {tableName === 'crm_contacts' && (
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
            )}

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Statut Email</label>
                <Select value={localFilters.emailStatus || "all"} onValueChange={(value) => updateFilter('emailStatus', value === "all" ? undefined : value)}>
                  <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {EMAIL_STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Séniorité</label>
                <Select value={localFilters.seniority || "all"} onValueChange={(value) => updateFilter('seniority', value === "all" ? undefined : value)}>
                  <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Toutes les séniorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les séniorités</SelectItem>
                    {SENIORITY_OPTIONS.map(seniority => (
                      <SelectItem key={seniority} value={seniority}>{seniority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Étape</label>
                <Select value={localFilters.stage || "all"} onValueChange={(value) => updateFilter('stage', value === "all" ? undefined : value)}>
                  <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Toutes les étapes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les étapes</SelectItem>
                    {STAGE_OPTIONS.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Nombre d'employés</label>
                <Select value={localFilters.nbEmployees || "all"} onValueChange={(value) => updateFilter('nbEmployees', value === "all" ? undefined : value)}>
                  <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Toutes les tailles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les tailles</SelectItem>
                    {NB_EMPLOYEES_OPTIONS.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Département</label>
                <Select value={localFilters.departments || "all"} onValueChange={(value) => updateFilter('departments', value === "all" ? undefined : value)}>
                  <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    {DEPARTMENTS_OPTIONS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tableName === 'crm_contacts' && (
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
            )}

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

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Propriétaire Contact</label>
                <Input
                  placeholder="Propriétaire du contact"
                  value={localFilters.contactOwner || ""}
                  onChange={(e) => updateFilter('contactOwner', e.target.value || undefined)}
                  className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                />
              </div>
            )}

            {tableName === 'apollo_contacts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Listes Apollo</label>
                <Input
                  placeholder="Nom des listes"
                  value={localFilters.lists || ""}
                  onChange={(e) => updateFilter('lists', e.target.value || undefined)}
                  className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                />
              </div>
            )}
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
                {localFilters.emailStatus && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Email: {localFilters.emailStatus}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('emailStatus')} />
                  </Badge>
                )}
                {localFilters.seniority && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Séniorité: {localFilters.seniority}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('seniority')} />
                  </Badge>
                )}
                {localFilters.stage && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Étape: {localFilters.stage}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('stage')} />
                  </Badge>
                )}
                {localFilters.nbEmployees && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Employés: {localFilters.nbEmployees}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('nbEmployees')} />
                  </Badge>
                )}
                {localFilters.departments && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Département: {localFilters.departments}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('departments')} />
                  </Badge>
                )}
                {localFilters.contactOwner && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Propriétaire: {localFilters.contactOwner}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('contactOwner')} />
                  </Badge>
                )}
                {localFilters.lists && (
                  <Badge variant="secondary" className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in">
                    Listes: {localFilters.lists}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeFilter('lists')} />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
   );
 };

export default TableFilters;