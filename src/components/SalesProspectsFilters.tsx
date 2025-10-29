import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Filter,
  X,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Phone,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export interface SalesProspectsFilterValues {
  dateRange?: DateRange;
  hasPhoneNumber?: boolean;
}


interface SalesProspectsFiltersProps {
  filters: SalesProspectsFilterValues;
  onFiltersChange: (filters: SalesProspectsFilterValues) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  showOnlyButton?: boolean;
  isFilterExpanded?: boolean;
  onFilterExpandedChange?: (expanded: boolean) => void;
  filterMode?: 'assigned' | 'traites' | 'rappeler';
}


const SalesProspectsFilters: React.FC<SalesProspectsFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  isOpen = false,
  onToggle,
  showOnlyButton = false,
  isFilterExpanded = false,
  onFilterExpandedChange,
  filterMode = 'assigned',
}) => {
  const [localFilters, setLocalFilters] =
    useState<SalesProspectsFilterValues>(filters);

  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof SalesProspectsFilterValues, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof SalesProspectsFilterValues) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = filters && Object.keys(filters).length > 0;

  const activeFilterCount = filters ? Object.keys(filters).length : 0;

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
          <Badge
            variant="secondary"
            className="ml-1 h-5 px-1.5 text-xs animate-scale-in"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }

  const getDateRangeLabel = () => {
    switch (filterMode) {
      case 'assigned':
        return 'Période d\'assignation';
      case 'traites':
        return 'Période de finalisation';
      case 'rappeler':
        return 'Période de rappel';
      default:
        return 'Période de traitement';
    }
  };

  const getDateRangePlaceholder = () => {
    switch (filterMode) {
      case 'assigned':
        return 'Sélectionner une période d\'assignation';
      case 'traites':
        return 'Sélectionner une période de finalisation';
      case 'rappeler':
        return 'Sélectionner une période de rappel';
      default:
        return 'Sélectionner une période';
    }
  };


  return (
    <motion.div
      className="mb-2"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98],
      }}
      style={{ overflow: "hidden" }}
    >
      <Card className="border-l-4 border-l-primary/20">
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Header with chevron button */}
          <div
            className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer"
            onClick={() => onFilterExpandedChange?.(!isFilterExpanded)}
          >
            <Filter className="h-4 w-4" />
            <h3 className="text-sm font-medium text-foreground">
              Filtres stratégiques
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200"
            >
              {isFilterExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                style={{ overflow: "hidden" }}
              >
                {/* Reset button */}
                {hasActiveFilters && (
                  <div className="flex justify-end animate-fade-in mb-4">
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
                <div
                  className="space-y-2 animate-fade-in mb-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <label className="text-sm font-medium text-foreground/80">
                    {getDateRangeLabel()}
                  </label>
                  <DateRangePicker
                    dateRange={localFilters.dateRange}
                    onDateRangeChange={(range) =>
                      updateFilter("dateRange", range)
                    }
                    placeholder={getDateRangePlaceholder()}
                  />
                </div>

                {/* Phone filter */}
                <div
                  className="space-y-2 animate-fade-in"
                  style={{ animationDelay: "200ms" }}
                >
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Numéro de téléphone disponible
                  </label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="phone-filter"
                      checked={localFilters.hasPhoneNumber || false}
                      onCheckedChange={(checked) =>
                        updateFilter(
                          "hasPhoneNumber",
                          checked ? true : undefined
                        )
                      }
                    />
                    <label
                      htmlFor="phone-filter"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      {localFilters.hasPhoneNumber
                        ? "Prospects avec téléphone uniquement"
                        : "Tous les prospects"}
                    </label>
                  </div>
                </div>

                {/* Active filters display */}
                {hasActiveFilters && (
                  <div
                    className="space-y-3 animate-fade-in"
                    style={{ animationDelay: "300ms" }}
                  >
                    <label className="text-sm font-medium text-foreground/80">
                      Filtres actifs
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {localFilters.dateRange?.from && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in"
                        >
                          Période:{" "}
                          {format(localFilters.dateRange.from, "dd/MM/yyyy", {
                            locale: fr,
                          })}
                       {localFilters.dateRange.to &&
                            ` - ${format(
                              localFilters.dateRange.to,
                              "dd/MM/yyyy",
                              {
                                locale: fr,
                              }
                            )}`}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => removeFilter("dateRange")}
                          />
                        </Badge>
                      )}
                      {localFilters.hasPhoneNumber && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in"
                        >
                          Avec téléphone
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => removeFilter("hasPhoneNumber")}
                          />
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalesProspectsFilters;
