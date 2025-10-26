import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";

export interface SalesProspectsFilterValues {
  dateRange?: DateRange;
  statutProspect?: string;
  sdrId?: string;
  prospectType?: string;
  hasPhoneNumber?: boolean; // Nouveau filtre
}

interface SDR {
  sdr_id: string;
  sdr_email: string;
  sdr_first_name: string | null;
  sdr_last_name: string | null;
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
}

const STATUT_PROSPECT_OPTIONS = [
  "RÉPONDEUR",
  "Importé avec statut",
  "RDV",
  "B",
  "MAIL À ENVOYER",
  "MAIL ENVOYÉ",
];

const PROSPECT_TYPE_OPTIONS = ["traites", "rappeler"];

const SalesProspectsFilters: React.FC<SalesProspectsFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  isOpen = false,
  onToggle,
  showOnlyButton = false,
  isFilterExpanded = false,
  onFilterExpandedChange,
}) => {
  const [localFilters, setLocalFilters] =
    useState<SalesProspectsFilterValues>(filters);
  const [sdrList, setSdrList] = useState<SDR[]>([]);
  const [loadingSdr, setLoadingSdr] = useState(false);

  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Charger la liste des SDR
  useEffect(() => {
    const fetchSdrList = async () => {
      setLoadingSdr(true);
      try {
        const { data, error } = await supabase
          .from("sales_sdr_prospects_view")
          .select("sdr_id, sdr_email, sdr_first_name, sdr_last_name")
          .not("sdr_id", "is", null)
          .order("sdr_email");

        if (error) throw error;

        // Dédupliquer par sdr_id
        const uniqueSdrs =
          data?.reduce((acc: SDR[], current: SDR) => {
            const existing = acc.find((sdr) => sdr.sdr_id === current.sdr_id);
            if (!existing) {
              acc.push(current);
            }
            return acc;
          }, []) || [];

        setSdrList(uniqueSdrs);
      } catch (error) {
        console.error("Erreur lors du chargement des SDR:", error);
      } finally {
        setLoadingSdr(false);
      }
    };

    fetchSdrList();
  }, []);

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

  const getSdrDisplayName = (sdr: SDR) => {
    if (sdr.sdr_first_name && sdr.sdr_last_name) {
      return `${sdr.sdr_first_name} ${sdr.sdr_last_name} (${sdr.sdr_email})`;
    }
    return sdr.sdr_email;
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
                    Période de traitement
                  </label>
                  <DateRangePicker
                    dateRange={localFilters.dateRange}
                    onDateRangeChange={(range) =>
                      updateFilter("dateRange", range)
                    }
                    placeholder="Sélectionner une période de traitement"
                  />
                </div>

                {/* Select filters */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in"
                  style={{ animationDelay: "200ms" }}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">
                      Statut de traitement
                    </label>
                    <Select
                      value={localFilters.statutProspect || "all"}
                      onValueChange={(value) =>
                        updateFilter(
                          "statutProspect",
                          value === "all" ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {STATUT_PROSPECT_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">
                      SDR qui a traité
                    </label>
                    <Select
                      value={localFilters.sdrId || "all"}
                      onValueChange={(value) =>
                        updateFilter(
                          "sdrId",
                          value === "all" ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                        <SelectValue
                          placeholder={
                            loadingSdr ? "Chargement..." : "Tous les SDR"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les SDR</SelectItem>
                        {sdrList.map((sdr) => (
                          <SelectItem key={sdr.sdr_id} value={sdr.sdr_id}>
                            {getSdrDisplayName(sdr)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">
                      Type de prospect
                    </label>
                    <Select
                      value={localFilters.prospectType || "all"}
                      onValueChange={(value) =>
                        updateFilter(
                          "prospectType",
                          value === "all" ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {PROSPECT_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === "traites" ? "Traités" : "À rappeler"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
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
                      {localFilters.statutProspect && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in"
                        >
                          Statut: {localFilters.statutProspect}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => removeFilter("statutProspect")}
                          />
                        </Badge>
                      )}
                      {localFilters.sdrId && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in"
                        >
                          SDR:{" "}
                          {sdrList.find(
                            (sdr) => sdr.sdr_id === localFilters.sdrId
                          )?.sdr_email || localFilters.sdrId}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => removeFilter("sdrId")}
                          />
                        </Badge>
                      )}
                      {localFilters.prospectType && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 transition-all duration-200 hover:bg-primary/20 animate-scale-in"
                        >
                          Type:{" "}
                          {localFilters.prospectType === "traites"
                            ? "Traités"
                            : "À rappeler"}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                            onClick={() => removeFilter("prospectType")}
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
