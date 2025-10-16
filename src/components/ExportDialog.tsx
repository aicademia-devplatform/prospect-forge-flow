import React, { useState, useMemo } from "react";
import moment from "moment";
import "moment/locale/fr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  FileSpreadsheet,
  Check,
  Settings,
  Columns,
  FileType,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: "apollo_contacts" | "crm_contacts" | "hubspot_contacts";
  totalCount: number;
  currentPageCount: number;
  appliedFilters: {
    searchTerm?: string;
    sectionFilter?: string;
    dateRange?: { from?: Date; to?: Date };
    dataSection?: string | string[];
    zohoStatus?: string;
    apolloStatus?: string;
    contactActive?: string;
    industrie?: string;
    company?: string;
  };
  onExport: (options: ExportOptions) => Promise<void>;
  availableColumns?: ColumnDefinition[];
}

export interface ColumnDefinition {
  key: string;
  label: string;
  category?:
    | "basic"
    | "contact"
    | "company"
    | "status"
    | "zoho"
    | "tools"
    | "hubspot"
    | "apollo"
    | "dates"
    | "custom";
  enabled?: boolean;
}

export interface ExportOptions {
  scope: "current" | "all";
  filename: string;
  format: "xlsx" | "csv" | "json";
  columns: string[];
  csvOptions?: {
    delimiter: "," | ";" | "\t" | "|";
    encoding: "UTF-8" | "ISO-8859-1" | "Windows-1252";
    includeHeaders: boolean;
    quoteStrings: boolean;
  };
  includeGoogleSheets: boolean;
}

const defaultCrmColumns: ColumnDefinition[] = [
  // Informations de base
  { key: "email", label: "Email", category: "basic", enabled: true },
  { key: "firstname", label: "Prénom", category: "basic", enabled: true },
  { key: "name", label: "Nom", category: "basic", enabled: true },

  // Coordonnées
  { key: "mobile", label: "Mobile", category: "contact", enabled: false },
  { key: "tel", label: "Téléphone", category: "contact", enabled: false },
  {
    key: "linkedin_url",
    label: "LinkedIn",
    category: "contact",
    enabled: false,
  },

  // Entreprise
  { key: "company", label: "Entreprise", category: "company", enabled: true },
  { key: "city", label: "Ville", category: "company", enabled: false },
  { key: "country", label: "Pays", category: "company", enabled: false },
  { key: "industrie", label: "Industrie", category: "company", enabled: false },
  { key: "website", label: "Site web", category: "company", enabled: false },
  {
    key: "nb_employees",
    label: "Nombre d'employés",
    category: "company",
    enabled: false,
  },

  // Statuts CRM
  { key: "data_section", label: "Section", category: "status", enabled: false },
  {
    key: "contact_active",
    label: "Contact actif",
    category: "status",
    enabled: false,
  },

  // Zoho
  {
    key: "zoho_status",
    label: "Statut Zoho",
    category: "zoho",
    enabled: false,
  },
  { key: "zoho_tag", label: "Tag Zoho", category: "zoho", enabled: false },
  {
    key: "zoho_updated_by",
    label: "Mis à jour par (Zoho)",
    category: "zoho",
    enabled: false,
  },
  {
    key: "zoho_product_interest",
    label: "Intérêt produit Zoho",
    category: "zoho",
    enabled: false,
  },
  {
    key: "zoho_status_2",
    label: "Statut 2 Zoho",
    category: "zoho",
    enabled: false,
  },

  // Systeme.io
  {
    key: "systemeio_list",
    label: "Liste Systeme.io",
    category: "tools",
    enabled: false,
  },

  // Brevo
  { key: "brevo_tag", label: "Tag Brevo", category: "tools", enabled: false },
  {
    key: "brevo_unsuscribe",
    label: "Désabonné Brevo",
    category: "tools",
    enabled: false,
  },
  {
    key: "brevo_open_number",
    label: "Ouvertures Brevo",
    category: "tools",
    enabled: false,
  },
  {
    key: "brevo_click_number",
    label: "Clics Brevo",
    category: "tools",
    enabled: false,
  },

  // HubSpot
  {
    key: "hubspot_lead_status",
    label: "Lead Status HubSpot",
    category: "hubspot",
    enabled: false,
  },
  {
    key: "hubspot_life_cycle_phase",
    label: "Phase cycle de vie HubSpot",
    category: "hubspot",
    enabled: false,
  },
  {
    key: "hubspot_buy_role",
    label: "Rôle d'achat HubSpot",
    category: "hubspot",
    enabled: false,
  },

  // Apollo
  {
    key: "apollo_status",
    label: "Statut Apollo",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_list",
    label: "Liste Apollo",
    category: "apollo",
    enabled: false,
  },

  // Dates
  {
    key: "created_at",
    label: "Date de création",
    category: "dates",
    enabled: false,
  },
  {
    key: "updated_at",
    label: "Date de mise à jour",
    category: "dates",
    enabled: false,
  },
];

const defaultApolloColumns: ColumnDefinition[] = [
  { key: "email", label: "Email", category: "basic", enabled: true },
  { key: "first_name", label: "Prénom", category: "basic", enabled: true },
  { key: "last_name", label: "Nom", category: "basic", enabled: true },
  { key: "company", label: "Entreprise", category: "company", enabled: true },
  { key: "title", label: "Titre", category: "basic", enabled: true },
  {
    key: "work_direct_phone",
    label: "Téléphone direct",
    category: "contact",
    enabled: false,
  },
  { key: "mobile_phone", label: "Mobile", category: "contact", enabled: false },
  {
    key: "person_linkedin_url",
    label: "LinkedIn profil",
    category: "contact",
    enabled: false,
  },
  {
    key: "company_linkedin_url",
    label: "LinkedIn entreprise",
    category: "company",
    enabled: false,
  },
  { key: "website", label: "Site web", category: "company", enabled: false },
  { key: "industry", label: "Industrie", category: "company", enabled: false },
  {
    key: "nb_employees",
    label: "Nombre d'employés",
    category: "company",
    enabled: false,
  },
  { key: "seniority", label: "Séniorité", category: "status", enabled: false },
  {
    key: "email_status",
    label: "Statut email",
    category: "status",
    enabled: false,
  },
  {
    key: "created_at",
    label: "Date de création",
    category: "custom",
    enabled: false,
  },
];

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  tableName,
  totalCount,
  currentPageCount,
  appliedFilters,
  onExport,
  availableColumns,
}) => {
  const [scope, setScope] = useState<"current" | "all">("current");
  const [filename, setFilename] = useState(
    `export_${tableName}_${new Date().toISOString().split("T")[0]}`
  );
  const [format, setFormat] = useState<"xlsx" | "csv" | "json">("xlsx");
  const [includeGoogleSheets, setIncludeGoogleSheets] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // CSV Options
  const [csvDelimiter, setCsvDelimiter] = useState<"," | ";" | "\t" | "|">(",");
  const [csvEncoding, setCsvEncoding] = useState<
    "UTF-8" | "ISO-8859-1" | "Windows-1252"
  >("UTF-8");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [quoteStrings, setQuoteStrings] = useState(true);

  // Columns management
  const defaultColumns =
    tableName === "crm_contacts" ? defaultCrmColumns : defaultApolloColumns;
  const [columns, setColumns] = useState<ColumnDefinition[]>(
    availableColumns || defaultColumns
  );

  const selectedColumns = useMemo(
    () => columns.filter((col) => col.enabled).map((col) => col.key),
    [columns]
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.searchTerm) count++;
    if (appliedFilters.sectionFilter) count++;
    if (appliedFilters.dateRange?.from || appliedFilters.dateRange?.to) count++;
    if (appliedFilters.dataSection) count++;
    if (appliedFilters.zohoStatus) count++;
    if (appliedFilters.apolloStatus) count++;
    if (appliedFilters.contactActive) count++;
    if (appliedFilters.industrie) count++;
    if (appliedFilters.company) count++;
    return count;
  };

  const handleExport = async () => {
    if (!filename.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de fichier",
        variant: "destructive",
      });
      return;
    }

    if (selectedColumns.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une colonne à exporter",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        scope,
        filename: filename.trim(),
        format,
        columns: selectedColumns,
        csvOptions:
          format === "csv"
            ? {
                delimiter: csvDelimiter,
                encoding: csvEncoding,
                includeHeaders,
                quoteStrings,
              }
            : undefined,
        includeGoogleSheets,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleColumn = (key: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const toggleAllColumns = (enabled: boolean) => {
    setColumns(columns.map((col) => ({ ...col, enabled })));
  };

  const toggleCategoryColumns = (category: string, enabled: boolean) => {
    setColumns(
      columns.map((col) =>
        col.category === category ? { ...col, enabled } : col
      )
    );
  };

  const getTableDisplayName = () => {
    return tableName === "apollo_contacts" ? "Contacts Apollo" : "Contacts CRM";
  };

  const getFormatIcon = () => {
    switch (format) {
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4" />;
      case "csv":
        return <FileType className="h-4 w-4" />;
      case "json":
        return <FileType className="h-4 w-4" />;
    }
  };

  const getFormatExtension = () => {
    switch (format) {
      case "xlsx":
        return ".xlsx";
      case "csv":
        return ".csv";
      case "json":
        return ".json";
    }
  };

  const columnsByCategory = useMemo(() => {
    const categorized: Record<string, ColumnDefinition[]> = {
      basic: [],
      contact: [],
      company: [],
      status: [],
      custom: [],
    };

    columns.forEach((col) => {
      const category = col.category || "custom";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(col);
    });

    return categorized;
  }, [columns]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: "Informations de base",
      contact: "Coordonnées",
      company: "Entreprise",
      status: "Statuts CRM",
      zoho: "Zoho",
      tools: "Outils Marketing (Systeme.io, Brevo)",
      hubspot: "HubSpot",
      apollo: "Apollo",
      dates: "Dates",
      custom: "Autres",
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Exporter les données
          </DialogTitle>
          <DialogDescription>
            Configurez les options d'exportation pour {getTableDisplayName()}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="general"
          className="flex-1 overflow-hidden flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Colonnes ({selectedColumns.length})
            </TabsTrigger>
            <TabsTrigger value="format" className="flex items-center gap-2">
              {getFormatIcon()}
              Format
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full pr-4">
              <TabsContent value="general" className="space-y-6 mt-4">
                {/* Scope Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Étendue de l'exportation
                  </Label>
                  <RadioGroup
                    value={scope}
                    onValueChange={(value) =>
                      setScope(value as "current" | "all")
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="current" id="current" />
                      <Label
                        htmlFor="current"
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">
                          Page actuelle seulement
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentPageCount} contacts visibles
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="cursor-pointer flex-1">
                        <div className="font-medium">
                          Toutes les pages avec filtres
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalCount} contacts au total
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Applied Filters Summary */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Filtres appliqués
                  </Label>
                  {getActiveFiltersCount() > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-600" />
                        {getActiveFiltersCount()} filtre(s) actif(s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appliedFilters.searchTerm && (
                          <Badge variant="secondary">
                            Recherche: "{appliedFilters.searchTerm}"
                          </Badge>
                        )}
                        {appliedFilters.sectionFilter && (
                          <Badge variant="secondary">
                            Section: {appliedFilters.sectionFilter}
                          </Badge>
                        )}
                        {appliedFilters.dateRange?.from && (
                          <Badge variant="secondary">
                            Période:{" "}
                            {moment(appliedFilters.dateRange.from).format(
                              "D MMM YYYY"
                            )}
                            {appliedFilters.dateRange.to
                              ? ` - ${moment(
                                  appliedFilters.dateRange.to
                                ).format("D MMM YYYY")}`
                              : ""}
                          </Badge>
                        )}
                        {appliedFilters.dataSection && (
                          <Badge variant="secondary">
                            Section données: {appliedFilters.dataSection}
                          </Badge>
                        )}
                        {appliedFilters.zohoStatus && (
                          <Badge variant="secondary">
                            Statut Zoho: {appliedFilters.zohoStatus}
                          </Badge>
                        )}
                        {appliedFilters.apolloStatus && (
                          <Badge variant="secondary">
                            Statut Apollo: {appliedFilters.apolloStatus}
                          </Badge>
                        )}
                        {appliedFilters.contactActive && (
                          <Badge variant="secondary">
                            Contact actif: {appliedFilters.contactActive}
                          </Badge>
                        )}
                        {appliedFilters.industrie && (
                          <Badge variant="secondary">
                            Industrie: {appliedFilters.industrie}
                          </Badge>
                        )}
                        {appliedFilters.company && (
                          <Badge variant="secondary">
                            Entreprise: {appliedFilters.company}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                      Aucun filtre appliqué - tous les contacts seront exportés
                    </div>
                  )}
                </div>

                <Separator />

                {/* Filename Input */}
                <div className="space-y-2">
                  <Label htmlFor="filename" className="text-sm font-medium">
                    Nom du fichier
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="filename"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="Nom du fichier d'exportation"
                      className="flex-1"
                    />
                    <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                      {getFormatExtension()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Le fichier sera sauvegardé au format {format.toUpperCase()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="columns"
                className="mt-4 flex flex-col h-[calc(90vh-280px)]"
              >
                <div className="flex items-center justify-between pb-4">
                  <Label className="text-sm font-medium">
                    Sélection des colonnes ({selectedColumns.length}{" "}
                    sélectionnées)
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllColumns(true)}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllColumns(false)}
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                </div>

                <Separator className="mb-4" />

                <div className="space-y-4 overflow-y-auto pr-3 flex-1 scrollbar-custom">
                  {Object.entries(columnsByCategory).map(
                    ([category, categoryColumns]) => {
                      if (categoryColumns.length === 0) return null;

                      const allEnabled = categoryColumns.every(
                        (col) => col.enabled
                      );
                      const someEnabled = categoryColumns.some(
                        (col) => col.enabled
                      );

                      return (
                        <Card key={category}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {getCategoryLabel(category)}
                                <Badge variant="secondary" className="text-xs">
                                  {
                                    categoryColumns.filter((col) => col.enabled)
                                      .length
                                  }
                                  /{categoryColumns.length}
                                </Badge>
                              </CardTitle>
                              <Checkbox
                                checked={allEnabled}
                                onCheckedChange={(checked) =>
                                  toggleCategoryColumns(
                                    category,
                                    checked === true
                                  )
                                }
                                className={
                                  someEnabled && !allEnabled
                                    ? "data-[state=checked]:bg-orange-600"
                                    : ""
                                }
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {categoryColumns.map((col) => (
                              <div
                                key={col.key}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                              >
                                <Checkbox
                                  id={`col-${col.key}`}
                                  checked={col.enabled}
                                  onCheckedChange={() => toggleColumn(col.key)}
                                />
                                <Label
                                  htmlFor={`col-${col.key}`}
                                  className="flex-1 cursor-pointer text-sm"
                                >
                                  {col.label}
                                  <div className="text-xs text-muted-foreground">
                                    {col.key}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    }
                  )}
                </div>
              </TabsContent>

              <TabsContent value="format" className="space-y-6 mt-4">
                {/* Format Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Format de fichier
                  </Label>
                  <RadioGroup
                    value={format}
                    onValueChange={(value) =>
                      setFormat(value as "xlsx" | "csv" | "json")
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="xlsx" id="xlsx" />
                      <Label htmlFor="xlsx" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">Excel (XLSX)</div>
                            <div className="text-xs text-muted-foreground">
                              Recommandé pour la plupart des usages
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="csv" id="csv" />
                      <Label htmlFor="csv" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <FileType className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">CSV</div>
                            <div className="text-xs text-muted-foreground">
                              Compatible avec tous les systèmes
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="json" id="json" />
                      <Label htmlFor="json" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <FileType className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="font-medium">JSON</div>
                            <div className="text-xs text-muted-foreground">
                              Pour intégrations API et développeurs
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* CSV Options */}
                {format === "csv" && (
                  <>
                    <Separator />
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Options CSV</CardTitle>
                        <CardDescription className="text-xs">
                          Configurez les paramètres spécifiques au format CSV
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delimiter" className="text-sm">
                            Délimiteur
                          </Label>
                          <Select
                            value={csvDelimiter}
                            onValueChange={(value) =>
                              setCsvDelimiter(value as "," | ";" | "\t" | "|")
                            }
                          >
                            <SelectTrigger id="delimiter">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=",">Virgule (,)</SelectItem>
                              <SelectItem value=";">
                                Point-virgule (;)
                              </SelectItem>
                              <SelectItem value="\t">
                                Tabulation (\t)
                              </SelectItem>
                              <SelectItem value="|">Pipe (|)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="encoding" className="text-sm">
                            Encodage
                          </Label>
                          <Select
                            value={csvEncoding}
                            onValueChange={(value) =>
                              setCsvEncoding(
                                value as "UTF-8" | "ISO-8859-1" | "Windows-1252"
                              )
                            }
                          >
                            <SelectTrigger id="encoding">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTF-8">
                                UTF-8 (Recommandé)
                              </SelectItem>
                              <SelectItem value="ISO-8859-1">
                                ISO-8859-1
                              </SelectItem>
                              <SelectItem value="Windows-1252">
                                Windows-1252
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="headers"
                              checked={includeHeaders}
                              onCheckedChange={(checked) =>
                                setIncludeHeaders(checked === true)
                              }
                            />
                            <Label
                              htmlFor="headers"
                              className="text-sm cursor-pointer"
                            >
                              Inclure les en-têtes de colonnes
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="quotes"
                              checked={quoteStrings}
                              onCheckedChange={(checked) =>
                                setQuoteStrings(checked === true)
                              }
                            />
                            <Label
                              htmlFor="quotes"
                              className="text-sm cursor-pointer"
                            >
                              Entourer les chaînes de guillemets
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between mt-4 flex-shrink-0 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {scope === "current" ? currentPageCount : totalCount} contacts •{" "}
            {selectedColumns.length} colonnes • {format.toUpperCase()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-pulse" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
