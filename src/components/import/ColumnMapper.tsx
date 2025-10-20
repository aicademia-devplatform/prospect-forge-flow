/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Columns3,
  Search,
  Check,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SDRAssignment } from "./SDRAssignment";

interface ColumnMapperProps {
  data: {
    headers: string[];
    rows: any[];
    fileName: string;
  };
  targetTable: "crm_contacts" | "apollo_contacts" | "prospects";
  onBack: () => void;
  onNext: (
    mapping: Record<string, string>,
    assignments?: Record<string, string>
  ) => void;
  onCancel: () => void;
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({
  data,
  targetTable,
  onBack,
  onNext,
  onCancel,
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [isSelecting, setIsSelecting] = useState<Record<string, boolean>>({});
  const [showSDRAssignment, setShowSDRAssignment] = useState(false);
  const isInitialized = useRef(false);

  // Traduction des noms de champs en français (optimisé avec useMemo)
  const fieldLabels: Record<string, string> = useMemo(
    () => ({
      // Champs communs
      email: "Email",
      firstname: "Prénom",
      first_name: "Prénom",
      name: "Nom",
      last_name: "Nom",
      company: "Entreprise",
      title: "Fonction",
      mobile: "Mobile",
      tel: "Téléphone",
      tel_pro: "Téléphone Pro",
      address: "Adresse",
      city: "Ville",
      departement: "Département",
      country: "Pays",
      linkedin_url: "URL LinkedIn",
      person_linkedin_url: "URL LinkedIn Personnel",
      linkedin_company_url: "URL LinkedIn Entreprise",
      company_linkedin_url: "URL LinkedIn Entreprise",
      linkedin_function: "Fonction LinkedIn",
      company_website: "Site Web Entreprise",
      website: "Site Web",
      industrie: "Industrie",
      industry: "Industrie",
      nb_employees: "Nombre d'employés",
      num_employees: "Nombre d'employés",
      mobile_2: "Mobile 2",
      full_name: "Nom Complet",
      contact_active: "Contact Actif",
      systemeio_list: "Liste Systeme.io",
      apollo_list: "Liste Apollo",
      brevo_tag: "Tag Brevo",
      zoho_tag: "Tag Zoho",
      arlynk_status: "Statut Arlynk",
      aicademia_high_status: "Statut Aicademia High",
      aicademia_low_status: "Statut Aicademia Low",

      // Prospects
      lead_email: "Email du Lead",
      source_table: "Table Source",
      source_id: "ID Source",
      notes_sales: "Notes Commercial",
      statut_prospect: "Statut Prospect",
      date_action: "Date d'Action",
      manager_notes: "Notes Manager",
      rejection_reason: "Raison de Rejet",

      // Apollo contacts
      company_name_for_emails: "Nom Entreprise pour Emails",
      company_address: "Adresse Entreprise",
      company_city: "Ville Entreprise",
      company_state: "État Entreprise",
      company_country: "Pays Entreprise",
      company_phone: "Téléphone Entreprise",
      work_direct_phone: "Téléphone Direct Travail",
      home_phone: "Téléphone Domicile",
      mobile_phone: "Téléphone Mobile",
      corporate_phone: "Téléphone Entreprise",
      other_phone: "Autre Téléphone",
      state: "État",
      region: "Région",

      // Statuts email
      email_status: "Statut Email",
      email_confidence: "Confiance Email",
      primary_email_source: "Source Email Principal",
      primary_email_catch_all_status: "Statut Catch-All Email",
      primary_email_last_verified_at: "Dernière Vérification Email",
      primary_email_verification_source: "Source Vérification Email",
      secondary_email: "Email Secondaire",
      secondary_email_source: "Source Email Secondaire",
      secondary_email_status: "Statut Email Secondaire",
      secondary_email_verification_source:
        "Source Vérification Email Secondaire",
      tertiary_email: "Email Tertiaire",
      tertiary_email_source: "Source Email Tertiaire",
      tertiary_email_status: "Statut Email Tertiaire",
      tertiary_email_verification_source: "Source Vérification Email Tertiaire",

      // Professionnel
      seniority: "Ancienneté",
      departments: "Départements",
      categorie_fonction: "Catégorie Fonction",

      // Réseaux sociaux
      facebook_url: "URL Facebook",
      twitter_url: "URL Twitter",

      // Commercial
      stage: "Étape",
      lifecycle_stage: "Phase du Cycle de Vie",
      lists: "Listes",
      contact_owner: "Propriétaire Contact",
      account_owner: "Propriétaire Compte",

      // Activité
      email_sent: "Email Envoyé",
      email_open: "Email Ouvert",
      email_bounced: "Email Rebondi",
      replied: "A Répondu",
      demoed: "Démo Effectuée",
      last_contacted: "Dernier Contact",
      activity: "Activité",

      // Entreprise détails
      secteur_activite: "Secteur d'Activité",
      number_of_retail_locations: "Nombre de Magasins",
      technologies: "Technologies",
      keywords: "Mots-clés",

      // Financier
      annual_revenue: "Chiffre d'Affaires Annuel",
      total_funding: "Financement Total",
      latest_funding: "Dernier Financement",
      latest_funding_amount: "Montant Dernier Financement",
      last_raised_at: "Date Dernière Levée",
      subsidiary_of: "Filiale de",

      // Identifiants
      apollo_contact_id: "ID Contact Apollo",
      apollo_account_id: "ID Compte Apollo",

      // Statut
      statut: "Statut",
      zoho_status: "Statut Zoho",
      apollo_status: "Statut Apollo",
      data_section: "Section Données",

      // Intent
      primary_intent_topic: "Sujet d'Intention Principal",
      primary_intent_score: "Score d'Intention Principal",
      secondary_intent_topic: "Sujet d'Intention Secondaire",
      secondary_intent_score: "Score d'Intention Secondaire",

      // Colonnes de scoring
      zoho_ma_score: "Score MA Zoho",
      zoho_crm_notation_score: "Score Notation CRM Zoho",
      arlynk_score: "Score Arlynk",
      aicademia_score: "Score Aicademia",
      total_score: "Score Total",

      // Colonnes Apollo
      apollo_email_verification: "Vérification Email Apollo",
      apollo_owner: "Propriétaire Apollo",
      apollo_last_contact: "Dernier Contact Apollo",
      apollo_description: "Description Apollo",
      apollo_arlynk_sequence: "Séquence Arlynk Apollo",
      apollo_open_number_arlynk_sequence:
        "Nombre Ouvertures Séquence Arlynk Apollo",
      apollo_click_number_arlynk_sequence:
        "Nombre Clics Séquence Arlynk Apollo",
      apollo_reply_number_arlynk_sequence:
        "Nombre Réponses Séquence Arlynk Apollo",
      apollo_aicademia_sequence: "Séquence Aicademia Apollo",
      apollo_open_number_aicademia_sequence:
        "Nombre Ouvertures Séquence Aicademia Apollo",
      apollo_click_number_aicademia_sequence:
        "Nombre Clics Séquence Aicademia Apollo",
      apollo_reply_number_aicademia_sequence:
        "Nombre Réponses Séquence Aicademia Apollo",

      // Colonnes Zoho
      zoho_report_to: "Rapporte à Zoho",
      zoho_updated_by: "Mis à jour par Zoho",
      zoho_created_at: "Créé le Zoho",
      zoho_updated_at: "Mis à jour le Zoho",
      zoho_description: "Description Zoho",
      zoho_last_activity: "Dernière Activité Zoho",
      zoho_product_interest: "Intérêt Produit Zoho",
      zoho_status_2: "Statut Zoho 2",
      zoho_industrie_tag: "Tag Industrie Zoho",
      zoho_arlynk_mark: "Marque Arlynk Zoho",
      zoho_account_size: "Taille Compte Zoho",
      zoho_chat: "Chat Zoho",
      zoho_last_chat_interaction: "Dernière Interaction Chat Zoho",
      zoho_subscription: "Abonnement Zoho",
      zoho_last_ma_interaction: "Dernière Interaction MA Zoho",
      abonnement_zoho_ma: "Abonnement MA Zoho",

      // Colonnes Brevo
      brevo_last_mail_campain: "Dernière Campagne Mail Brevo",
      brevo_last_sms_campain: "Dernière Campagne SMS Brevo",
      brevo_unsuscribe: "Désabonné Brevo",
      brevo_open_number: "Nombre Ouvertures Brevo",
      brevo_click_number: "Nombre Clics Brevo",
      brevo_reply_number: "Nombre Réponses Brevo",

      // Colonnes HubSpot
      hubspot_lead_status: "Statut Lead HubSpot",
      hubspot_contact_owner: "Propriétaire Contact HubSpot",
      hubspot_life_cycle_phase: "Phase Cycle de Vie HubSpot",
      hubspot_buy_role: "Rôle Achat HubSpot",
      hubspot_created_at: "Créé le HubSpot",
      hubspot_modified_at: "Modifié le HubSpot",
      hubspot_last_activity: "Dernière Activité HubSpot",
      hubspot_notes: "Notes HubSpot",
      hubspot_anis_comment: "Commentaire Anis HubSpot",

      // Colonnes Arlynk Cold
      arlynk_cold_status: "Statut Cold Arlynk",
      arlynk_cold_note: "Note Cold Arlynk",
      arlynk_cold_action_date: "Date Action Cold Arlynk",
      arlynk_cold_relance2: "Relance 2 Cold Arlynk",
      arlynk_cold_relance3: "Relance 3 Cold Arlynk",

      // Colonnes Aicademia
      aicademia_cold_status: "Statut Cold Aicademia",
      aicademia_cold_note: "Note Cold Aicademia",
      aicademia_cold_action_date: "Date Action Cold Aicademia",
      aicademia_cold_relance2: "Relance 2 Cold Aicademia",
      aicademia_cold_relance3: "Relance 3 Cold Aicademia",

      // Colonnes métadonnées
      email_id: "ID Email",
      email_domain: "Domaine Email",
      created_at: "Créé le",
      updated_at: "Mis à jour le",
      _source_file: "Fichier Source",
      _processed_at: "Traité le",
      _email_unique: "Email Unique",
    }),
    []
  );

  // Champs disponibles selon la table cible
  const targetFields: Record<string, string[]> = {
    crm_contacts: [
      "email",
      "data_section",
      "firstname",
      "name",
      "address",
      "city",
      "departement",
      "country",
      "tel_pro",
      "tel",
      "mobile",
      "mobile_2",
      "company",
      "nb_employees",
      "linkedin_function",
      "industrie",
      "linkedin_url",
      "linkedin_company_url",
      "company_website",
      "systemeio_list",
      "apollo_list",
      "brevo_tag",
      "zoho_tag",
      "zoho_status",
      "apollo_status",
      "arlynk_status",
      "aicademia_high_status",
      "aicademia_low_status",
      "zoho_ma_score",
      "zoho_crm_notation_score",
      "arlynk_score",
      "aicademia_score",
      "apollo_email_verification",
      "apollo_owner",
      "apollo_last_contact",
      "apollo_description",
      "apollo_arlynk_sequence",
      "apollo_open_number_arlynk_sequence",
      "apollo_click_number_arlynk_sequence",
      "apollo_reply_number_arlynk_sequence",
      "apollo_aicademia_sequence",
      "apollo_open_number_aicademia_sequence",
      "apollo_click_number_aicademia_sequence",
      "apollo_reply_number_aicademia_sequence",
      "zoho_report_to",
      "zoho_updated_by",
      "zoho_created_at",
      "zoho_updated_at",
      "zoho_description",
      "zoho_last_activity",
      "zoho_product_interest",
      "zoho_status_2",
      "zoho_industrie_tag",
      "zoho_arlynk_mark",
      "zoho_account_size",
      "zoho_chat",
      "zoho_last_chat_interaction",
      "zoho_subscription",
      "zoho_last_ma_interaction",
      "brevo_last_mail_campain",
      "brevo_last_sms_campain",
      "brevo_unsuscribe",
      "brevo_open_number",
      "brevo_click_number",
      "brevo_reply_number",
      "hubspot_lead_status",
      "hubspot_contact_owner",
      "hubspot_life_cycle_phase",
      "hubspot_buy_role",
      "hubspot_created_at",
      "hubspot_modified_at",
      "hubspot_last_activity",
      "hubspot_notes",
      "hubspot_anis_comment",
      "arlynk_cold_status",
      "arlynk_cold_note",
      "arlynk_cold_action_date",
      "arlynk_cold_relance2",
      "arlynk_cold_relance3",
      "aicademia_cold_status",
      "aicademia_cold_note",
      "aicademia_cold_action_date",
      "aicademia_cold_relance2",
      "aicademia_cold_relance3",
      "email_id",
      "email_domain",
      "full_name",
      "contact_active",
      "total_score",
      "created_at",
      "updated_at",
      "abonnement_zoho_ma",
      "_source_file",
      "_processed_at",
      "_email_unique",
    ],
    prospects: [
      "email",
      "data_section",
      "firstname",
      "name",
      "address",
      "city",
      "departement",
      "country",
      "tel_pro",
      "tel",
      "mobile",
      "mobile_2",
      "company",
      "nb_employees",
      "linkedin_function",
      "industrie",
      "linkedin_url",
      "linkedin_company_url",
      "company_website",
      "systemeio_list",
      "apollo_list",
      "brevo_tag",
      "zoho_tag",
      "zoho_status",
      "apollo_status",
      "arlynk_status",
      "aicademia_high_status",
      "aicademia_low_status",
      "zoho_ma_score",
      "zoho_crm_notation_score",
      "arlynk_score",
      "aicademia_score",
      "apollo_email_verification",
      "apollo_owner",
      "apollo_last_contact",
      "apollo_description",
      "apollo_arlynk_sequence",
      "apollo_open_number_arlynk_sequence",
      "apollo_click_number_arlynk_sequence",
      "apollo_reply_number_arlynk_sequence",
      "apollo_aicademia_sequence",
      "apollo_open_number_aicademia_sequence",
      "apollo_click_number_aicademia_sequence",
      "apollo_reply_number_aicademia_sequence",
      "zoho_report_to",
      "zoho_updated_by",
      "zoho_created_at",
      "zoho_updated_at",
      "zoho_description",
      "zoho_last_activity",
      "zoho_product_interest",
      "zoho_status_2",
      "zoho_industrie_tag",
      "zoho_arlynk_mark",
      "zoho_account_size",
      "zoho_chat",
      "zoho_last_chat_interaction",
      "zoho_subscription",
      "zoho_last_ma_interaction",
      "brevo_last_mail_campain",
      "brevo_last_sms_campain",
      "brevo_unsuscribe",
      "brevo_open_number",
      "brevo_click_number",
      "brevo_reply_number",
      "hubspot_lead_status",
      "hubspot_contact_owner",
      "hubspot_life_cycle_phase",
      "hubspot_buy_role",
      "hubspot_created_at",
      "hubspot_modified_at",
      "hubspot_last_activity",
      "hubspot_notes",
      "hubspot_anis_comment",
      "arlynk_cold_status",
      "arlynk_cold_note",
      "arlynk_cold_action_date",
      "arlynk_cold_relance2",
      "arlynk_cold_relance3",
      "aicademia_cold_status",
      "aicademia_cold_note",
      "aicademia_cold_action_date",
      "aicademia_cold_relance2",
      "aicademia_cold_relance3",
      "email_id",
      "email_domain",
      "full_name",
      "contact_active",
      "total_score",
      "abonnement_zoho_ma",
    ],
    apollo_contacts: [
      // Informations personnelles
      "email",
      "first_name",
      "last_name",
      "title",
      // Informations entreprise
      "company",
      "company_name_for_emails",
      "company_address",
      "company_city",
      "company_state",
      "company_country",
      "company_phone",
      "company_linkedin_url",
      // Coordonnées
      "work_direct_phone",
      "home_phone",
      "mobile_phone",
      "corporate_phone",
      "other_phone",
      // Localisation personnelle
      "city",
      "state",
      "country",
      "region",
      // Email statuses et sources
      "email_status",
      "email_confidence",
      "primary_email_source",
      "primary_email_catch_all_status",
      "primary_email_last_verified_at",
      "primary_email_verification_source",
      "secondary_email",
      "secondary_email_source",
      "secondary_email_status",
      "secondary_email_verification_source",
      "tertiary_email",
      "tertiary_email_source",
      "tertiary_email_status",
      "tertiary_email_verification_source",
      // Informations professionnelles
      "seniority",
      "departments",
      "categorie_fonction",
      // Liens sociaux
      "person_linkedin_url",
      "website",
      "facebook_url",
      "twitter_url",
      // Informations commerciales
      "stage",
      "lifecycle_stage",
      "lists",
      "contact_owner",
      "account_owner",
      // Activité et engagement
      "email_sent",
      "email_open",
      "email_bounced",
      "replied",
      "demoed",
      "last_contacted",
      "activity",
      // Informations entreprise détaillées
      "industry",
      "secteur_activite",
      "nb_employees",
      "num_employees",
      "number_of_retail_locations",
      "technologies",
      "keywords",
      // Informations financières
      "annual_revenue",
      "total_funding",
      "latest_funding",
      "latest_funding_amount",
      "last_raised_at",
      "subsidiary_of",
      // Identifiants Apollo
      "apollo_contact_id",
      "apollo_account_id",
      // Statut et métadonnées
      "statut",
      // Intent tracking
      "primary_intent_topic",
      "primary_intent_score",
      "secondary_intent_topic",
      "secondary_intent_score",
    ],
  };

  const fields = targetFields[targetTable];

  useEffect(() => {
    // Mapping automatique basé sur les noms de colonnes (seulement au premier chargement)
    if (!isInitialized.current) {
      const autoMapping: Record<string, string> = {};
      data.headers.forEach((header) => {
        const normalizedHeader = header
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_");
        if (fields.includes(normalizedHeader)) {
          autoMapping[header] = normalizedHeader;
        }
      });
      setMapping(autoMapping);
      isInitialized.current = true;
    }
  }, [data.headers, targetTable, fields]);

  const handleMappingChange = useCallback(
    (csvColumn: string, targetColumn: string) => {
      // Éviter les clics multiples rapides
      if (isSelecting[csvColumn]) return;

      setIsSelecting((prev) => ({ ...prev, [csvColumn]: true }));

      // Mettre à jour le mapping immédiatement
      setMapping((prev) => ({
        ...prev,
        [csvColumn]: targetColumn,
      }));

      // Fermer le popover après un petit délai pour éviter les clics accidentels
      setTimeout(() => {
        setOpenPopovers((prev) => ({
          ...prev,
          [csvColumn]: false,
        }));

        // Effacer la recherche après sélection
        setSearchTerms((prev) => ({
          ...prev,
          [csvColumn]: "",
        }));

        // Réactiver la sélection
        setIsSelecting((prev) => ({ ...prev, [csvColumn]: false }));
      }, 150);
    },
    [isSelecting]
  );

  const togglePopover = useCallback((csvColumn: string) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [csvColumn]: !prev[csvColumn],
    }));
  }, []);

  // Fonction de filtrage personnalisée pour la recherche
  const filterFields = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return fields;

      const term = searchTerm.toLowerCase();
      return fields.filter((field) => {
        const label = fieldLabels[field] || field;
        return (
          field.toLowerCase().includes(term) ||
          label.toLowerCase().includes(term)
        );
      });
    },
    [fields, fieldLabels]
  );

  const getMappedCount = () => {
    return Object.values(mapping).filter((v) => v && v !== "ignore").length;
  };

  const handleNext = () => {
    if (getMappedCount() === 0) {
      return;
    }

    // Si c'est pour la table prospects et qu'on a un email, on va à l'assignation SDR
    if (targetTable === "prospects" && hasEmailField()) {
      setShowSDRAssignment(true);
    } else {
      onNext(mapping);
    }
  };

  const hasEmailField = () => {
    return Object.values(mapping).includes("email");
  };

  const handleSDRAssignmentNext = (assignments: Record<string, string>) => {
    onNext(mapping, assignments);
  };

  const handleSDRAssignmentBack = () => {
    setShowSDRAssignment(false);
  };

  // Si on affiche l'assignation SDR
  if (showSDRAssignment) {
    return (
      <SDRAssignment
        data={data}
        mapping={mapping}
        onBack={handleSDRAssignmentBack}
        onNext={handleSDRAssignmentNext}
        onCancel={onCancel}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Columns3 className="h-5 w-5" />
                Mapper les colonnes
              </CardTitle>
              <CardDescription>
                Associez les colonnes du fichier CSV aux champs de la base de
                données
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {getMappedCount()} / {data.headers.length} colonnes mappées
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="space-y-4">
              {data.headers.map((header, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    mapping[header] && mapping[header] !== "ignore"
                      ? "bg-green-50 border-green-200"
                      : mapping[header] === "ignore"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-card"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{header}</Label>
                      {mapping[header] && mapping[header] !== "ignore" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {mapping[header] === "ignore" && (
                        <XCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exemple: {data.rows[0]?.[index] || "N/A"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <Popover
                      open={openPopovers[header] || false}
                      onOpenChange={() => togglePopover(header)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={
                            mapping[header] && mapping[header] !== "ignore"
                              ? "default"
                              : mapping[header] === "ignore"
                              ? "destructive"
                              : "outline"
                          }
                          role="combobox"
                          aria-expanded={openPopovers[header] || false}
                          className="w-full justify-between h-fit text-sm"
                        >
                          {mapping[header] && mapping[header] !== "ignore" ? (
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {fieldLabels[mapping[header]] ||
                                  mapping[header]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {mapping[header]}
                              </span>
                            </div>
                          ) : mapping[header] === "ignore" ? (
                            <span className="text-white font-medium">
                              Colonne ignorée
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Sélectionner un champ...
                            </span>
                          )}
                          {isSelecting[header] ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Rechercher un champ..."
                              value={searchTerms[header] || ""}
                              onChange={(e) =>
                                setSearchTerms((prev) => ({
                                  ...prev,
                                  [header]: e.target.value,
                                }))
                              }
                              className="pl-8 h-8 text-sm"
                            />
                          </div>
                          <div className="mt-2 max-h-60 overflow-y-auto">
                            <div className="space-y-1">
                              <div
                                className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                onClick={() =>
                                  handleMappingChange(header, "ignore")
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    mapping[header] === "ignore"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="text-muted-foreground">
                                  Ignorer cette colonne
                                </span>
                              </div>
                              {filterFields(searchTerms[header] || "").map(
                                (field) => {
                                  const label = fieldLabels[field] || field;
                                  return (
                                    <div
                                      key={field}
                                      className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                      onClick={() =>
                                        handleMappingChange(header, field)
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          mapping[header] === field
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {field}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                              {filterFields(searchTerms[header] || "")
                                .length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Aucun résultat trouvé.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleNext} disabled={getMappedCount() === 0}>
                {targetTable === "prospects" && hasEmailField()
                  ? "Assigner aux SDR"
                  : "Continuer"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ColumnMapper;
