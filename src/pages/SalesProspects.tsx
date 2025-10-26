import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Search,
  User,
  Calendar,
  FileText,
  Mail,
  CheckCircle,
  Filter,
  Download,
  Phone,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { encryptEmail } from "@/lib/emailCrypto";
import { ValiderProspectDialog } from "@/components/ValiderProspectDialog";
import SalesProspectsFilters, {
  SalesProspectsFilterValues,
} from "@/components/SalesProspectsFilters";
import DataTablePagination from "@/components/ui/data-table-pagination";
import ExportDialog, {
  ExportOptions,
  ColumnDefinition,
} from "@/components/ExportDialog";
import moment from "moment";
import "moment/locale/fr";
import { motion } from "framer-motion";

interface SDRProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  sales_user_id: string;
  notes_sales: string | null;
  statut_prospect: string | null;
  date_action: string | null;
  completed_at: string | null;
  sdr_id: string;
  sdr_email: string;
  sdr_first_name: string | null;
  sdr_last_name: string | null;
  prospect_type: "traites" | "rappeler";
  created_at: string;
}

interface ValidatedProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  rdv_date: string;
  rdv_notes: string | null;
  commentaire_validation: string;
  validated_at: string;
  validated_by: string;
  sales_user_id: string;
  sdr_id: string;
}

interface ArchivedProspect {
  id: string;
  lead_email: string;
  source_table: string;
  source_id: string;
  commentaire_rejet: string;
  raison_rejet: string | null;
  rejected_at: string;
  rejected_by: string;
  sales_user_id: string;
  sdr_id: string | null;
}

interface ContactData {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  mobile_phone?: string;
  person_linkedin_url?: string;
}

const exportColumns: ColumnDefinition[] = [
  // Informations de base du prospect
  { key: "lead_email", label: "Email", category: "basic", enabled: true },
  { key: "first_name", label: "Prénom", category: "basic", enabled: true },
  { key: "last_name", label: "Nom", category: "basic", enabled: true },
  { key: "company", label: "Entreprise", category: "basic", enabled: true },
  { key: "title", label: "Titre/Fonction", category: "basic", enabled: false },

  // Données SDR
  { key: "sdr_email", label: "Email SDR", category: "custom", enabled: true },
  { key: "sdr_name", label: "Nom SDR", category: "custom", enabled: true },
  {
    key: "statut_prospect",
    label: "Statut",
    category: "status",
    enabled: true,
  },
  { key: "prospect_type", label: "Type", category: "status", enabled: true },
  { key: "notes_sales", label: "Notes SDR", category: "custom", enabled: true },
  {
    key: "created_at",
    label: "Date traitement",
    category: "dates",
    enabled: true,
  },

  // Données CRM - Numéros de téléphone
  {
    key: "crm_mobile",
    label: "Mobile CRM",
    category: "contact",
    enabled: true,
  },
  {
    key: "crm_tel",
    label: "Téléphone CRM",
    category: "contact",
    enabled: true,
  },
  {
    key: "crm_tel_pro",
    label: "Téléphone Pro CRM",
    category: "contact",
    enabled: true,
  },
  {
    key: "crm_mobile_2",
    label: "Mobile 2 CRM",
    category: "contact",
    enabled: false,
  },
  { key: "crm_city", label: "Ville CRM", category: "company", enabled: false },
  {
    key: "crm_country",
    label: "Pays CRM",
    category: "company",
    enabled: false,
  },
  {
    key: "crm_linkedin_url",
    label: "LinkedIn CRM",
    category: "contact",
    enabled: false,
  },
  {
    key: "zoho_status",
    label: "Statut Zoho",
    category: "zoho",
    enabled: false,
  },

  // Données Apollo - Numéros de téléphone
  {
    key: "apollo_mobile_phone",
    label: "Mobile Apollo",
    category: "contact",
    enabled: true,
  },
  {
    key: "apollo_work_direct_phone",
    label: "Téléphone Direct Apollo",
    category: "contact",
    enabled: true,
  },
  {
    key: "apollo_company_phone",
    label: "Téléphone Entreprise Apollo",
    category: "contact",
    enabled: true,
  },
  {
    key: "apollo_home_phone",
    label: "Téléphone Domicile Apollo",
    category: "contact",
    enabled: false,
  },
  {
    key: "apollo_other_phone",
    label: "Autre Téléphone Apollo",
    category: "contact",
    enabled: false,
  },
  {
    key: "apollo_corporate_phone",
    label: "Téléphone Corporate Apollo",
    category: "contact",
    enabled: false,
  },
  // Données Apollo - Autres
  {
    key: "apollo_seniority",
    label: "Séniorité",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_departments",
    label: "Département",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_nb_employees",
    label: "Nb employés",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_industry",
    label: "Industrie",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_website",
    label: "Site web",
    category: "apollo",
    enabled: false,
  },
  {
    key: "apollo_linkedin_url",
    label: "LinkedIn Apollo",
    category: "apollo",
    enabled: false,
  },

  // Données HubSpot - Numéros de téléphone
  {
    key: "hubspot_phone",
    label: "Téléphone HubSpot",
    category: "contact",
    enabled: true,
  },
  {
    key: "hubspot_hs_calculated_phone_number",
    label: "Téléphone Calculé HubSpot",
    category: "contact",
    enabled: true,
  },
  {
    key: "hubspot_hs_calculated_phone_number_country_code",
    label: "Code Pays Téléphone HubSpot",
    category: "contact",
    enabled: false,
  },
  {
    key: "hubspot_hs_searchable_calculated_phone_number",
    label: "Téléphone Recherchable HubSpot",
    category: "contact",
    enabled: false,
  },
  // Données HubSpot - Autres
  {
    key: "hs_lead_status",
    label: "Lead Status HubSpot",
    category: "hubspot",
    enabled: false,
  },
  {
    key: "lifecyclestage",
    label: "Lifecycle Stage",
    category: "hubspot",
    enabled: false,
  },

  // Données Brevo - Numéros de téléphone
  {
    key: "brevo_telephone",
    label: "Téléphone Brevo",
    category: "contact",
    enabled: true,
  },
];

const SalesProspects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [prospects, setProspects] = useState<SDRProspect[]>([]);
  const [validatedProspects, setValidatedProspects] = useState<
    ValidatedProspect[]
  >([]);
  const [archivedProspects, setArchivedProspects] = useState<
    ArchivedProspect[]
  >([]);
  const [contactsData, setContactsData] = useState<Record<string, ContactData>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<SDRProspect | null>(
    null
  );
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState<SalesProspectsFilterValues>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // États pour l'exportation
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // État pour contrôler l'affichage de la colonne téléphone
  const [showPhoneColumn, setShowPhoneColumn] = useState(false);

  // Déterminer l'onglet actif depuis l'URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/sales-prospects/rappeler")) return "rappeler";
    if (path.includes("/sales-prospects/traites")) return "traites";
    return "prevalidated";
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (value: string) => {
    if (value === "prevalidated") {
      navigate("/sales-prospects");
    } else if (value === "rappeler") {
      navigate("/sales-prospects/rappeler");
    } else if (value === "traites") {
      navigate("/sales-prospects/traites");
    }
  };

  // Rediriger vers /sales-prospects si on est sur la route de base
  useEffect(() => {
    if (location.pathname === "/sales-prospects") {
      // On reste sur prevalidated
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchAllProspects();
  }, [user]);

  const fetchAllProspects = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Récupérer d'abord les prospects validés avec RDV
      let validatedQuery = supabase
        .from("prospects_valides")
        .select("*")
        .order("validated_at", { ascending: false });

      // Si l'utilisateur est SDR, filtrer par sdr_id
      if (userRole === 'sdr') {
        validatedQuery = validatedQuery.eq('sdr_id', user.id);
      }

      const { data: validatedData, error: validatedError } = await validatedQuery;

      if (validatedError) throw validatedError;
      setValidatedProspects((validatedData || []) as ValidatedProspect[]);

      // Récupérer les prospects archivés/rejetés
      let archivedQuery = supabase
        .from("prospects_archives")
        .select("*")
        .order("rejected_at", { ascending: false });

      // Si l'utilisateur est SDR, filtrer par sdr_id
      if (userRole === 'sdr') {
        archivedQuery = archivedQuery.eq('sdr_id', user.id);
      }

      const { data: archivedData, error: archivedError } = await archivedQuery;

      if (archivedError) throw archivedError;
      setArchivedProspects((archivedData || []) as ArchivedProspect[]);

      // Créer un Set des emails déjà traités (validés ou archivés)
      const treatedEmails = new Set([
        ...(validatedData || []).map((p) => p.lead_email),
        ...(archivedData || []).map((p) => p.lead_email),
      ]);

      // Récupérer les prospects prévalidés (SDR) en excluant ceux déjà traités
      let prevalidatedQuery = supabase
        .from("sales_sdr_prospects_view")
        .select("*")
        .order("created_at", { ascending: false });

      // Si l'utilisateur est SDR, filtrer uniquement ses prospects assignés
      if (userRole === 'sdr') {
        prevalidatedQuery = prevalidatedQuery.eq('sdr_id', user.id);
      }

      const { data: prevalidatedData, error: prevalidatedError } = await prevalidatedQuery;

      if (prevalidatedError) throw prevalidatedError;

      // Filtrer les prospects déjà traités
      const filteredPrevalidated = (prevalidatedData || []).filter(
        (p: SDRProspect) => !treatedEmails.has(p.lead_email)
      );

      setProspects(filteredPrevalidated as SDRProspect[]);

      // Récupérer les informations des contacts
      const allEmails = [
        ...new Set([
          ...filteredPrevalidated.map((p) => p.lead_email),
          ...(validatedData || []).map((p) => p.lead_email),
          ...(archivedData || []).map((p) => p.lead_email),
        ]),
      ];
      await fetchContactsData(allEmails);
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactsData = async (emails: string[]) => {
    try {
      // Récupérer depuis crm_contacts d'abord
      const { data: crmData, error: crmError } = await supabase
        .from("crm_contacts")
        .select("email, firstname, name, company, mobile, linkedin_url")
        .in("email", emails);

      if (crmError) throw crmError;

      // Récupérer depuis apollo_contacts pour compléter
      const { data: apolloData, error: apolloError } = await supabase
        .from("apollo_contacts")
        .select(
          "email, first_name, last_name, company, title, mobile_phone, person_linkedin_url"
        )
        .in("email", emails);

      if (apolloError) throw apolloError;

      // Fusionner les données
      const contactsMap: Record<string, ContactData> = {};

      crmData?.forEach((contact) => {
        contactsMap[contact.email] = {
          email: contact.email,
          first_name: contact.firstname || "",
          last_name: contact.name || "",
          company: contact.company || "",
          mobile_phone: contact.mobile || "",
          person_linkedin_url: contact.linkedin_url || "",
        };
      });

      apolloData?.forEach((contact) => {
        if (!contactsMap[contact.email]) {
          contactsMap[contact.email] = {
            email: contact.email,
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            company: contact.company || "",
            title: contact.title || "",
            mobile_phone: contact.mobile_phone || "",
            person_linkedin_url: contact.person_linkedin_url || "",
          };
        }
      });

      setContactsData(contactsMap);
    } catch (error) {
      console.error("Error fetching contacts data:", error);
    }
  };

  const formatDate = (dateString: string) => {
    moment.locale("fr");
    return moment(dateString).format("DD/MM/YYYY à HH:mm");
  };

  // Récupérer les numéros de téléphone pour les prospects paginés quand le filtre est actif
  const emailsToLoad = showPhoneColumn
    ? prospects.map((p) => p.lead_email)
    : [];
  const phoneNumbers = usePhoneNumbers(emailsToLoad);

  // Filtrer les prospects selon les critères
  const filteredProspects = prospects.filter((prospect) => {
    const contact = contactsData[prospect.lead_email];
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      prospect.lead_email.toLowerCase().includes(searchLower) ||
      prospect.sdr_email.toLowerCase().includes(searchLower) ||
      contact?.first_name?.toLowerCase().includes(searchLower) ||
      contact?.last_name?.toLowerCase().includes(searchLower) ||
      contact?.company?.toLowerCase().includes(searchLower);

    // Filtres stratégiques
    const matchesDateRange =
      !filters.dateRange?.from ||
      !filters.dateRange?.to ||
      (prospect.created_at &&
        new Date(prospect.created_at) >= filters.dateRange.from &&
        new Date(prospect.created_at) <= filters.dateRange.to);

    const matchesStatut =
      !filters.statutProspect ||
      prospect.statut_prospect === filters.statutProspect;

    const matchesSdr = !filters.sdrId || prospect.sdr_id === filters.sdrId;

    const matchesProspectType =
      !filters.prospectType || prospect.prospect_type === filters.prospectType;

    // Filtre par présence de numéro de téléphone
    const matchesPhoneFilter =
      !filters.hasPhoneNumber ||
      phoneNumbers[prospect.lead_email]?.phones?.length > 0 ||
      phoneNumbers[prospect.lead_email]?.loading;

    // Combiner tous les filtres
    const matchesFilters =
      matchesDateRange &&
      matchesStatut &&
      matchesSdr &&
      matchesProspectType &&
      matchesPhoneFilter;

    if (activeTab === "prevalidated") {
      // Afficher tous les prospects (traités et à rappeler) dans "Prospects prévalidés"
      return matchesSearch && matchesFilters;
    } else if (activeTab === "rappeler") {
      return (
        matchesSearch && matchesFilters && prospect.prospect_type === "rappeler"
      );
    } else if (activeTab === "traites") {
      return (
        matchesSearch && matchesFilters && prospect.prospect_type === "traites"
      );
    }

    return matchesSearch && matchesFilters;
  });

  // Calculer la pagination
  const totalItems = filteredProspects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // S'assurer que currentPage ne dépasse pas le nombre total de pages
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProspects = filteredProspects.slice(startIndex, endIndex);

  const handleViewProspect = (email: string) => {
    const encryptedEmail = encryptEmail(email);
    navigate(`/prospect/${encryptedEmail}`);
  };

  const handleTraiterProspect = (prospect: SDRProspect) => {
    setSelectedProspect(prospect);
    setIsValidationDialogOpen(true);
  };

  const handleValidationSuccess = () => {
    fetchAllProspects(); // Rafraîchir la liste
  };

  // Fonctions de gestion des filtres
  const handleFiltersChange = (newFilters: SalesProspectsFilterValues) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleToggleFilters = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Fonctions de gestion de la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Retourner à la première page
  };

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Ajuster la page courante si elle dépasse le nombre total de pages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Activer/désactiver automatiquement la colonne téléphone selon le filtre
  useEffect(() => {
    if (filters.hasPhoneNumber) {
      setShowPhoneColumn(true);
    } else {
      setShowPhoneColumn(false);
    }
  }, [filters.hasPhoneNumber]);

  // Fonction pour enrichir les prospects avec toutes les données
  const enrichProspectsWithAllData = async (
    prospectsToExport: SDRProspect[]
  ) => {
    const emails = prospectsToExport.map((p) => p.lead_email);

    // Utiliser la edge function get-contact pour chaque email
    const enrichedData = await Promise.all(
      emails.map(async (email) => {
        try {
          const { data, error } = await supabase.functions.invoke(
            "get-contact",
            {
              body: { email },
            }
          );

          if (error || !data?.success) {
            console.error(`Error fetching data for ${email}:`, error);
            return null;
          }

          // Combiner toutes les données des sources
          const combinedData: any = { email };
          data.data?.forEach((contact: any) => {
            Object.keys(contact.data).forEach((key) => {
              const value = contact.data[key];
              const prefixedKey = `${contact.source_table.replace(
                "_contacts",
                ""
              )}_${key}`;
              if (value !== null && value !== "" && value !== undefined) {
                combinedData[prefixedKey] = value;
              }
            });
          });

          return combinedData;
        } catch (err) {
          console.error(`Error enriching ${email}:`, err);
          return null;
        }
      })
    );

    // Fusionner avec les données SDR
    return prospectsToExport.map((prospect, index) => {
      const enriched = enrichedData[index] || {};
      const contact: ContactData = contactsData[prospect.lead_email] || {
        email: prospect.lead_email,
        first_name: "",
        last_name: "",
        company: "",
        title: "",
        mobile_phone: "",
        person_linkedin_url: "",
      };

      return {
        lead_email: prospect.lead_email,
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        company: contact.company || "",
        title: contact.title || "",
        sdr_email: prospect.sdr_email,
        sdr_name: `${prospect.sdr_first_name} ${prospect.sdr_last_name}`,
        statut_prospect: prospect.statut_prospect,
        prospect_type: prospect.prospect_type,
        notes_sales: prospect.notes_sales,
        created_at: prospect.created_at,
        ...enriched,
      };
    });
  };

  // Fonction handleExport
  const handleExport = async (options: ExportOptions) => {
    try {
      setIsExporting(true);

      // Déterminer quels prospects exporter selon le scope
      let prospectsToExport: SDRProspect[] = [];

      if (options.scope === "current") {
        // Page actuelle seulement
        prospectsToExport = paginatedProspects;
      } else {
        // Tous les prospects filtrés
        prospectsToExport = filteredProspects;
      }

      toast({
        title: "Export en cours",
        description: `Enrichissement de ${prospectsToExport.length} prospects avec toutes les données...`,
      });

      // Enrichir les prospects avec toutes les données
      const enrichedProspects = await enrichProspectsWithAllData(
        prospectsToExport
      );

      // Filtrer les colonnes sélectionnées
      const filteredData = enrichedProspects.map((prospect) => {
        const filtered: any = {};
        options.columns.forEach((col) => {
          filtered[col] = prospect[col] || "";
        });
        return filtered;
      });

      // Exporter selon le format
      if (options.format === "xlsx") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Prospects SDR");
        XLSX.writeFile(wb, `${options.filename}.xlsx`);
      } else if (options.format === "csv") {
        const csvContent = convertToCSV(filteredData, options.csvOptions);
        downloadFile(csvContent, `${options.filename}.csv`, "text/csv");
      } else if (options.format === "json") {
        const jsonContent = JSON.stringify(filteredData, null, 2);
        downloadFile(
          jsonContent,
          `${options.filename}.json`,
          "application/json"
        );
      }

      toast({
        title: "Export réussi",
        description: `${enrichedProspects.length} prospects exportés avec succès`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[], options?: any) => {
    if (data.length === 0) return "";

    const delimiter = options?.delimiter || ",";
    const headers = Object.keys(data[0]);

    let csv = options?.includeHeaders ? headers.join(delimiter) + "\n" : "";

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header]?.toString() || "";
        return options?.quoteStrings ? `"${value}"` : value;
      });
      csv += values.join(delimiter) + "\n";
    });

    return csv;
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Chargement des prospects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Prospects SDR</h1>
        <p className="text-muted-foreground">
          Suivi des prospects traités par les SDR
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, SDR, nom, entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <SalesProspectsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
          showOnlyButton={true}
          onToggle={handleToggleFilters}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportDialogOpen(true)}
          className="h-9 px-3 gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </motion.div>

      {/* Composant de filtres */}
      {isFilterOpen && (
        <motion.div variants={itemVariants}>
          <SalesProspectsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            isFilterExpanded={isFilterOpen}
            onFilterExpandedChange={setIsFilterOpen}
          />
        </motion.div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prevalidated">
            Prospects prévalidés ({prospects.length})
          </TabsTrigger>
          <TabsTrigger value="rappeler">
            Rendez-vous programmés ({validatedProspects.length})
          </TabsTrigger>
          <TabsTrigger value="traites">
            Prospects traités (
            {validatedProspects.length + archivedProspects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prevalidated" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Tous les prospects prévalidés par les SDR</CardTitle>
                <CardDescription>
                  Liste complète avec toutes les informations et notes des SDR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Prospect</TableHead>
                          {showPhoneColumn && (
                            <TableHead>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Téléphone
                              </div>
                            </TableHead>
                          )}
                          <TableHead>Entreprise</TableHead>
                          <TableHead>SDR</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date d'action</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProspects.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={showPhoneColumn ? 9 : 8}
                              className="text-center text-muted-foreground py-8"
                            >
                              {totalItems === 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                  <p className="text-lg font-medium">
                                    Aucun prospect trouvé
                                  </p>
                                  <p className="text-sm">
                                    {Object.keys(filters).length > 0 ||
                                    searchTerm
                                      ? "Aucun prospect ne correspond aux critères de recherche et de filtrage."
                                      : "Aucun prospect disponible pour le moment."}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <p className="text-lg font-medium">
                                    Page vide
                                  </p>
                                  <p className="text-sm">
                                    Aucun prospect sur cette page. Essayez de
                                    changer de page ou de modifier les filtres.
                                  </p>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedProspects.map((prospect) => {
                            const contact = contactsData[prospect.lead_email];
                            return (
                              <TableRow key={prospect.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {contact?.first_name} {contact?.last_name}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {prospect.lead_email}
                                    </span>
                                  </div>
                                </TableCell>
                                {showPhoneColumn && (
                                  <TableCell>
                                    {phoneNumbers[prospect.lead_email]
                                      ?.loading ? (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-xs">
                                          Chargement...
                                        </span>
                                      </div>
                                    ) : phoneNumbers[prospect.lead_email]
                                        ?.phones?.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {phoneNumbers[
                                          prospect.lead_email
                                        ].phones
                                          .slice(0, 2)
                                          .map((phone, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-1 text-sm"
                                            >
                                              <Phone className="h-3 w-3 text-muted-foreground" />
                                              <span className="font-mono text-xs">
                                                {phone}
                                              </span>
                                            </div>
                                          ))}
                                        {phoneNumbers[prospect.lead_email]
                                          .phones.length > 2 && (
                                          <span className="text-xs text-muted-foreground">
                                            +
                                            {phoneNumbers[prospect.lead_email]
                                              .phones.length - 2}{" "}
                                            autre(s)
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell>{contact?.company || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                      <span className="text-sm">
                                        {prospect.sdr_first_name}{" "}
                                        {prospect.sdr_last_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {prospect.sdr_email}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {prospect.statut_prospect && (
                                    <Badge variant="outline">
                                      {prospect.statut_prospect}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      prospect.prospect_type === "traites"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {prospect.prospect_type === "traites"
                                      ? "Traité"
                                      : "À rappeler"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {prospect.date_action && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(prospect.date_action)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  {prospect.notes_sales && (
                                    <div className="flex items-start gap-1">
                                      <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm line-clamp-2">
                                        {prospect.notes_sales}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleViewProspect(prospect.lead_email)
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleTraiterProspect(prospect)
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Traiter
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination pour les prospects prévalidés */}
                {totalItems > 0 && (
                  <DataTablePagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={true}
                    itemsPerPageOptions={[10, 25, 50, 100]}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="rappeler" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Rendez-vous programmés</CardTitle>
                <CardDescription>
                  Prospects validés avec rendez-vous planifiés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Prospect</TableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Date RDV</TableHead>
                          <TableHead>Commentaire</TableHead>
                          <TableHead>Notes RDV</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedProspects.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground"
                            >
                              Aucun rendez-vous programmé
                            </TableCell>
                          </TableRow>
                        ) : (
                          validatedProspects
                            .filter((prospect) => {
                              const contact = contactsData[prospect.lead_email];
                              const searchLower = searchTerm.toLowerCase();
                              return (
                                !searchTerm ||
                                prospect.lead_email
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                contact?.first_name
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                contact?.last_name
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                contact?.company
                                  ?.toLowerCase()
                                  .includes(searchLower)
                              );
                            })
                            .map((prospect) => {
                              const contact = contactsData[prospect.lead_email];
                              return (
                                <TableRow key={prospect.id}>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {contact?.first_name}{" "}
                                        {contact?.last_name}
                                      </span>
                                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {prospect.lead_email}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {contact?.company || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(prospect.rdv_date)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="flex items-start gap-1">
                                      <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm line-clamp-2">
                                        {prospect.commentaire_validation}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    {prospect.rdv_notes && (
                                      <span className="text-sm line-clamp-2">
                                        {prospect.rdv_notes}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleViewProspect(prospect.lead_email)
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination pour les rendez-vous programmés */}
                {validatedProspects.length > 0 && (
                  <DataTablePagination
                    currentPage={1}
                    totalPages={1}
                    totalItems={validatedProspects.length}
                    itemsPerPage={validatedProspects.length}
                    onPageChange={() => {}}
                    showItemsPerPage={false}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="traites" className="space-y-4 mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Prospects traités</CardTitle>
                <CardDescription>
                  Tous les prospects validés ou rejetés par le sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Prospect</TableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date de traitement</TableHead>
                          <TableHead>Commentaire</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validatedProspects.length === 0 &&
                        archivedProspects.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground"
                            >
                              Aucun prospect traité
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {validatedProspects
                              .filter((prospect) => {
                                const contact =
                                  contactsData[prospect.lead_email];
                                const searchLower = searchTerm.toLowerCase();
                                return (
                                  !searchTerm ||
                                  prospect.lead_email
                                    .toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.first_name
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.last_name
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.company
                                    ?.toLowerCase()
                                    .includes(searchLower)
                                );
                              })
                              .map((prospect) => {
                                const contact =
                                  contactsData[prospect.lead_email];
                                return (
                                  <TableRow key={prospect.id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {contact?.first_name}{" "}
                                          {contact?.last_name}
                                        </span>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {prospect.lead_email}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {contact?.company || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="default"
                                        className="bg-green-600"
                                      >
                                        Validé
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(prospect.validated_at)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                      <div className="flex items-start gap-1">
                                        <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm line-clamp-2">
                                          {prospect.commentaire_validation}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleViewProspect(
                                            prospect.lead_email
                                          )
                                        }
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            {archivedProspects
                              .filter((prospect) => {
                                const contact =
                                  contactsData[prospect.lead_email];
                                const searchLower = searchTerm.toLowerCase();
                                return (
                                  !searchTerm ||
                                  prospect.lead_email
                                    .toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.first_name
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.last_name
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  contact?.company
                                    ?.toLowerCase()
                                    .includes(searchLower)
                                );
                              })
                              .map((prospect) => {
                                const contact =
                                  contactsData[prospect.lead_email];
                                return (
                                  <TableRow key={prospect.id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {contact?.first_name}{" "}
                                          {contact?.last_name}
                                        </span>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {prospect.lead_email}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {contact?.company || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="destructive">
                                        Rejeté
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(prospect.rejected_at)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                      <div className="flex items-start gap-1">
                                        <FileText className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm line-clamp-2">
                                          {prospect.commentaire_rejet}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleViewProspect(
                                            prospect.lead_email
                                          )
                                        }
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination pour les prospects traités */}
                {(validatedProspects.length > 0 ||
                  archivedProspects.length > 0) && (
                  <DataTablePagination
                    currentPage={1}
                    totalPages={1}
                    totalItems={
                      validatedProspects.length + archivedProspects.length
                    }
                    itemsPerPage={
                      validatedProspects.length + archivedProspects.length
                    }
                    onPageChange={() => {}}
                    showItemsPerPage={false}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {selectedProspect && (
        <ValiderProspectDialog
          open={isValidationDialogOpen}
          onOpenChange={setIsValidationDialogOpen}
          prospect={selectedProspect}
          onSuccess={handleValidationSuccess}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        tableName="crm_contacts"
        totalCount={filteredProspects.length}
        currentPageCount={paginatedProspects.length}
        appliedFilters={{
          searchTerm: searchTerm,
          dateRange: filters.dateRange,
        }}
        onExport={handleExport}
        availableColumns={exportColumns}
      />
    </motion.div>
  );
};

export default SalesProspects;
