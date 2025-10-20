import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  Mail,
  ExternalLink,
  Edit,
  FileText,
  Code,
  Database,
  Globe,
  Laptop,
  Server,
  Shield,
  Smartphone,
  Cpu,
  Cloud,
  Zap,
  Calendar,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TraiterProspectSidebar } from "@/components/TraiterProspectSidebar";
import { ModifierProspectSidebar } from "@/components/ModifierProspectSidebar";
import { ProspectActionSidebar } from "@/components/ProspectActionSidebar";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractEmailFromUrl } from "@/lib/emailCrypto";
import moment from "moment";
import "moment/locale/fr";
interface ProspectData {
  // CRM Data
  crm_id?: string;
  email: string;
  crm_firstname?: string;
  crm_name?: string;
  crm_company?: string;
  crm_city?: string;
  crm_country?: string;
  crm_mobile?: string;
  crm_linkedin_url?: string;
  zoho_status?: string;

  // Apollo Data
  apollo_id?: string;
  apollo_firstname?: string;
  apollo_lastname?: string;
  apollo_title?: string;
  apollo_company?: string;
  apollo_email_status?: string;
  apollo_seniority?: string;
  apollo_departments?: string;
  apollo_contact_owner?: string;
  apollo_phone?: string;
  apollo_mobile?: string;
  apollo_nb_employees?: number;
  apollo_industry?: string;
  apollo_linkedin_url?: string;
  apollo_company_linkedin_url?: string;
  apollo_website?: string;
  apollo_stage?: string;
  apollo_lists?: string;
  apollo_last_contacted?: string;
  apollo_status?: string;
  apollo_contact_id?: string;
  apollo_account_id?: string;
  apollo_city?: string;
  apollo_country?: string;
  apollo_email_sent?: boolean;
  apollo_email_open?: boolean;
  apollo_replied?: boolean;
  apollo_demoed?: boolean;
  apollo_technologies?: string;

  // Common fields
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  industry?: string;
  nb_employees?: number;
  mobile_phone?: string;
  work_direct_phone?: string;
  person_linkedin_url?: string;
  website?: string;
  city?: string;
  country?: string;
  data_source?: string;
  created_at?: string;
  updated_at?: string;

  // Additional CRM fields
  firstname?: string;
  name?: string;
  tel?: string;
  mobile?: string;
  mobile_2?: string;
  tel_pro?: string;
  address?: string;
  departement?: string;
  industrie?: string;
  linkedin_function?: string;
  company_website?: string;
  linkedin_company_url?: string;

  // HubSpot Data
  hs_object_id?: string;
  vid?: string;
  portal_id?: string;
  associatedcompanyid?: string;
  lead_guid?: string;
  primary_email?: string;
  hs_email_domain?: string;
  lifecyclestage?: string;
  hs_lead_status?: string;
  hs_pipeline?: string;
  hs_is_contact?: boolean;
  hs_is_unworked?: boolean;
  hs_count_is_unworked?: number;
  hs_count_is_worked?: number;
  hs_registered_member?: boolean;
  hs_membership_has_accessed_private_content?: boolean;
  hs_latest_source?: string;
  createdate_mc?: string;
  createdate_ms?: string;
  createdate?: string;
  lastmodifieddate?: string;
  lastmodifieddate_ms?: string;
  hs_first_outreach_date_mc?: string;
  hs_first_outreach_date_ms?: string;
  hs_first_outreach_date?: string;
  notes_last_contacted_mc?: string;
  notes_last_contacted_ms?: string;
  notes_last_contacted?: string;
  notes_last_updated_mc?: string;
  notes_last_updated_ms?: string;
  notes_last_updated?: string;
  hs_analytics_latest_source_timestamp_mc?: string;
  hs_latest_source_timestamp_ms?: string;
  hs_latest_source_timestamp?: string;
  hs_analytics_first_timestamp_mc?: string;
  hs_analytics_first_timestamp_ms?: string;
  hs_analytics_first_timestamp?: string;
  inserted_at?: string;
  identity_saved_at_mc?: string;
  hs_analytics_revenue?: number;
  hs_messaging_engagement_score?: number;
  hs_analytics_num_page_views?: number;
  hs_analytics_num_visits?: number;
  hs_analytics_num_event_completions?: number;
  hs_time_to_first_engagement?: number;
  hs_sa_first_engagement_date_mc?: string;
  hs_sa_first_engagement_object_type?: string;
  hs_sa_first_engagement_object_id?: string;
  num_notes?: number;
  num_contacted_notes?: number;
  num_conversion_events?: number;
  num_unique_conversion_events?: number;
  hs_object_source?: string;
  hs_object_source_id?: string;
  hs_object_source_user_id?: string;
  hs_object_source_label?: string;
  hubspot_owner_id?: string;
  hubspot_owner_assigneddate_mc?: string;
  hs_user_ids_of_all_owners?: string;
  hs_all_owner_ids?: string;
  properties_raw?: any;
  identity_profiles_raw?: any;

  // Sources data
  sources?: Array<{
    source_table: string;
    data: any;
  }>;
}
const ProspectDetails: React.FC = () => {
  // Fonction pour obtenir l'icône appropriée pour chaque technologie
  const getTechIcon = (techName: string) => {
    const tech = techName.toLowerCase().trim();
    if (
      tech.includes("react") ||
      tech.includes("vue") ||
      tech.includes("angular") ||
      tech.includes("javascript") ||
      tech.includes("js")
    )
      return Code;
    if (
      tech.includes("node") ||
      tech.includes("express") ||
      tech.includes("backend")
    )
      return Server;
    if (
      tech.includes("database") ||
      tech.includes("sql") ||
      tech.includes("mysql") ||
      tech.includes("postgresql") ||
      tech.includes("mongodb")
    )
      return Database;
    if (
      tech.includes("web") ||
      tech.includes("html") ||
      tech.includes("css") ||
      tech.includes("frontend")
    )
      return Globe;
    if (
      tech.includes("mobile") ||
      tech.includes("ios") ||
      tech.includes("android") ||
      tech.includes("flutter") ||
      tech.includes("react native")
    )
      return Smartphone;
    if (
      tech.includes("cloud") ||
      tech.includes("aws") ||
      tech.includes("azure") ||
      tech.includes("gcp")
    )
      return Cloud;
    if (
      tech.includes("security") ||
      tech.includes("auth") ||
      tech.includes("encryption")
    )
      return Shield;
    if (
      tech.includes("api") ||
      tech.includes("rest") ||
      tech.includes("graphql")
    )
      return Zap;
    if (
      tech.includes("python") ||
      tech.includes("java") ||
      tech.includes("c++") ||
      tech.includes("programming")
    )
      return Cpu;

    // Icône par défaut
    return Laptop;
  };

  // Fonction pour traduire les champs HubSpot en français
  const translateHubSpotField = (fieldName: string): string => {
    const translations: Record<string, string> = {
      // Informations générales HubSpot
      hs_object_id: "ID d'objet HubSpot",
      vid: "ID de visiteur",
      portal_id: "ID de portail",
      associatedcompanyid: "ID de l'entreprise associée",
      lead_guid: "GUID du lead",
      primary_email: "E-mail principal",
      hs_email_domain: "Domaine de l'e-mail HubSpot",

      // Statut et activité HubSpot
      lifecyclestage: "Stade du cycle de vie",
      hs_lead_status: "Statut du lead",
      hs_pipeline: "Pipeline",
      hs_is_contact: "Est un contact",
      hs_is_unworked: "Non travaillé",
      hs_count_is_unworked: "Compteur non travaillé",
      hs_count_is_worked: "Compteur travaillé",
      hs_registered_member: "Membre enregistré",
      hs_membership_has_accessed_private_content: "Accès au contenu privé",
      hs_latest_source: "Dernière source",

      // Dates clés HubSpot
      createdate_mc: "Date de création (HubSpot)",
      createdate_ms: "Date de création (HubSpot)",
      createdate: "Date de création",
      lastmodifieddate: "Date de dernière modification (HubSpot)",
      lastmodifieddate_ms: "Date de dernière modification (HubSpot)",
      hs_first_outreach_date_mc: "Date du premier contact (HubSpot)",
      hs_first_outreach_date_ms: "Date du premier contact (HubSpot)",
      hs_first_outreach_date: "Date du premier contact",
      notes_last_contacted_mc: "Dernière note contactée (HubSpot)",
      notes_last_contacted_ms: "Dernière note contactée (HubSpot)",
      notes_last_contacted: "Dernière note contactée",
      notes_last_updated_mc: "Dernière note mise à jour (HubSpot)",
      notes_last_updated_ms: "Dernière note mise à jour (HubSpot)",
      notes_last_updated: "Dernière note mise à jour",
      hs_analytics_latest_source_timestamp_mc:
        "Horodatage de la dernière source analytique (HubSpot)",
      hs_latest_source_timestamp_ms:
        "Horodatage de la dernière source (HubSpot)",
      hs_latest_source_timestamp: "Horodatage de la dernière source",
      hs_analytics_first_timestamp_mc:
        "Horodatage de la première source analytique (HubSpot)",
      hs_analytics_first_timestamp_ms:
        "Horodatage de la première source analytique (HubSpot)",
      hs_analytics_first_timestamp:
        "Horodatage de la première source analytique",
      inserted_at: "Inséré à",
      identity_saved_at_mc: "Identité sauvegardée à (HubSpot)",

      // Engagement et analytiques HubSpot
      hs_analytics_revenue: "Revenu analytique",
      hs_messaging_engagement_score: "Score d'engagement messagerie",
      hs_analytics_num_page_views: "Nombre de pages vues",
      hs_analytics_num_visits: "Nombre de visites",
      hs_analytics_num_event_completions: "Nombre d'événements complétés",
      hs_time_to_first_engagement: "Temps jusqu'au premier engagement",
      hs_sa_first_engagement_date_mc: "Date du premier engagement",
      hs_sa_first_engagement_object_type: "Type d'objet du premier engagement",
      hs_sa_first_engagement_object_id: "ID d'objet du premier engagement",
      num_notes: "Nombre de notes",
      num_contacted_notes: "Nombre de notes contactées",
      num_conversion_events: "Nombre d'événements de conversion",
      num_unique_conversion_events: "Nombre d'événements de conversion uniques",

      // Propriété et attribution HubSpot
      hs_object_source: "Source de l'objet",
      hs_object_source_id: "ID de source de l'objet",
      hs_object_source_user_id: "ID utilisateur de source de l'objet",
      hs_object_source_label: "Étiquette de source de l'objet",
      hubspot_owner_id: "ID du propriétaire HubSpot",
      hubspot_owner_assigneddate_mc:
        "Date d'affectation du propriétaire HubSpot",
      hs_user_ids_of_all_owners: "IDs utilisateur de tous les propriétaires",
      hs_all_owner_ids: "Tous les IDs de propriétaire",

      // Données brutes
      properties_raw: "Propriétés brutes",
      identity_profiles_raw: "Profils d'identité bruts",
    };

    return translations[fieldName] || fieldName;
  };

  // Fonction pour formater les valeurs HubSpot
  const formatHubSpotValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined || value === "") {
      return (
        <span className="text-muted-foreground italic">Non renseigné</span>
      );
    }

    // Gestion des objets complexes (JSONB)
    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <details className="cursor-pointer">
          <summary className="text-primary hover:underline text-sm">
            Voir les détails
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      );
    }

    // Gestion des booléens
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Oui" : "Non"}
        </Badge>
      );
    }

    // Gestion des dates
    if (
      fieldName.includes("date") ||
      fieldName.includes("timestamp") ||
      fieldName.includes("_at")
    ) {
      try {
        let date: Date;

        // Si c'est un timestamp en millisecondes (nombre)
        if (typeof value === "number" && value > 1000000000000) {
          date = new Date(value);
        }
        // Si c'est une chaîne de caractères
        else if (typeof value === "string") {
          // Si c'est déjà au format DD/MM/YYYY HH:mm:ss, on l'affiche tel quel
          if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(value)) {
            return <span className="text-sm">{value}</span>;
          }
          // Sinon on essaie de parser la date
          date = new Date(value);
        } else {
          date = new Date(value);
        }

        if (!isNaN(date.getTime())) {
          return (
            <span className="text-sm">
              {moment(date).format("DD/MM/YYYY HH:mm:ss")}
            </span>
          );
        }
      } catch (e) {
        // Si ce n'est pas une date valide, continuer avec le traitement normal
      }
    }

    // Gestion des nombres
    if (typeof value === "number") {
      return (
        <span className="text-sm font-mono">{value.toLocaleString()}</span>
      );
    }

    // Valeur par défaut
    return <span className="text-sm">{String(value)}</span>;
  };

  // Fonction pour détecter les champs HubSpot
  const isHubSpotField = (field: string) => {
    return (
      field.startsWith("hs_") ||
      field.startsWith("hubspot_") ||
      field === "vid" ||
      field === "portal_id" ||
      field === "lifecyclestage" ||
      field === "primary_email" ||
      field === "associatedcompanyid" ||
      field === "lead_guid" ||
      field === "properties_raw" ||
      field === "identity_profiles_raw"
    );
  };

  // Fonction pour traduire les noms de colonnes (compatible avec ContactDetails)
  const translateColumnName = (columnName: string): string => {
    return translateHubSpotField(columnName);
  };

  // Fonction pour formater les valeurs (compatible avec ContactDetails)
  const formatValue = (value: any, columnName: string) => {
    return formatHubSpotValue(value, columnName);
  };

  // Fonction spéciale pour rendre les données HubSpot avec le format en grilles
  const renderHubSpotData = (
    data: ProspectData,
    title: string = "Informations dans HubSpot"
  ) => {
    console.log("🔍 Debug HubSpot - Données reçues:", data);
    console.log("🔍 Debug HubSpot - Sources disponibles:", data.sources);

    // Chercher les données HubSpot dans les sources
    const hubspotSource = data.sources?.find(
      (source: any) => source.source_table === "hubspot_contacts"
    );
    console.log("🔍 Debug HubSpot - Source HubSpot trouvée:", hubspotSource);

    if (!hubspotSource) {
      console.log("❌ Debug HubSpot - Aucune source HubSpot trouvée");
      return null;
    }

    const hubspotData = hubspotSource.data;
    console.log("🔍 Debug HubSpot - Données HubSpot:", hubspotData);

    const hubspotFields = Object.keys(hubspotData).filter((field) =>
      isHubSpotField(field)
    );
    console.log("🔍 Debug HubSpot - Champs détectés:", hubspotFields);
    console.log(
      "🔍 Debug HubSpot - Tous les champs HubSpot disponibles:",
      Object.keys(hubspotData)
    );

    if (hubspotFields.length === 0) {
      console.log(
        "❌ Debug HubSpot - Aucun champ HubSpot détecté, section non affichée"
      );
      return null;
    }

    // Organiser les champs en grilles thématiques
    const identifierFields = hubspotFields.filter((field) =>
      [
        "hs_object_id",
        "vid",
        "portal_id",
        "associatedcompanyid",
        "lead_guid",
        "primary_email",
        "hs_email_domain",
      ].includes(field)
    );

    const statusFields = hubspotFields.filter((field) =>
      [
        "lifecyclestage",
        "hs_lead_status",
        "hs_pipeline",
        "hs_latest_source",
      ].includes(field)
    );

    const dateFields = hubspotFields.filter(
      (field) =>
        field.includes("date") ||
        field.includes("timestamp") ||
        field.includes("_at")
    );

    const analyticsFields = hubspotFields.filter((field) =>
      [
        "hs_analytics_revenue",
        "hs_messaging_engagement_score",
        "hs_analytics_num_page_views",
        "hs_analytics_num_visits",
        "hs_analytics_num_event_completions",
      ].includes(field)
    );

    const notesFields = hubspotFields.filter(
      (field) =>
        field.includes("notes") ||
        field.includes("num_") ||
        field.includes("conversion")
    );

    const ownershipFields = hubspotFields.filter(
      (field) =>
        field.includes("owner") ||
        field.includes("source") ||
        field.includes("user_id")
    );

    const booleanFields = hubspotFields.filter((field) =>
      [
        "hs_is_contact",
        "hs_is_unworked",
        "hs_registered_member",
        "hs_membership_has_accessed_private_content",
      ].includes(field)
    );

    const rawDataFields = hubspotFields.filter((field) =>
      ["properties_raw", "identity_profiles_raw"].includes(field)
    );

    const renderGrid = (fields: string[], gridTitle?: string) => {
      if (fields.length === 0) return null;

      return (
        <div className="space-y-4">
          {gridTitle && (
            <h4 className="text-sm font-semibold text-orange-700 border-b border-orange-200 pb-2">
              {gridTitle}
            </h4>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fields.map((field) => {
              const value = hubspotData[field];
              if (value === null || value === undefined || value === "")
                return null;

              return (
                <Card
                  key={field}
                  className="p-4 border-orange-100 bg-white/80 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
                      {translateColumnName(field)}
                    </span>
                    <div className="text-sm text-gray-800">
                      {formatValue(value, field)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    };

    // Vérifier si au moins une grille a du contenu
    const hasContent = [
      identifierFields,
      statusFields,
      dateFields,
      analyticsFields,
      notesFields,
      ownershipFields,
      booleanFields,
      rawDataFields,
    ].some((fields) =>
      fields.some((field) => {
        const value = hubspotData[field];
        return value !== null && value !== undefined && value !== "";
      })
    );

    console.log("🔍 Debug HubSpot - Vérification contenu:");
    console.log("  - identifierFields:", identifierFields);
    console.log("  - statusFields:", statusFields);
    console.log("  - dateFields:", dateFields);
    console.log("  - analyticsFields:", analyticsFields);
    console.log("  - notesFields:", notesFields);
    console.log("  - ownershipFields:", ownershipFields);
    console.log("  - booleanFields:", booleanFields);
    console.log("  - rawDataFields:", rawDataFields);
    console.log("  - hasContent:", hasContent);

    if (!hasContent) {
      console.log(
        "❌ Debug HubSpot - Aucun contenu trouvé dans les grilles, section non affichée"
      );
      return null;
    }

    console.log("✅ Debug HubSpot - Section HubSpot affichée avec succès");

    return (
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/30">
        <CardHeader className="bg-orange-500 text-white rounded-t-lg mb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Database className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/50">
          {renderGrid(identifierFields, "Identifiants et Informations de base")}
          {renderGrid(statusFields, "Statut et Pipeline")}
          {renderGrid(dateFields, "Dates importantes")}
          {renderGrid(analyticsFields, "Compteurs et Statistiques")}
          {renderGrid(notesFields, "Notes et Événements")}
          {renderGrid(ownershipFields, "Propriété et Attribution")}
          {renderGrid(booleanFields, "Statuts booléens")}
          {renderGrid(rawDataFields, "Données brutes")}
        </CardContent>
      </Card>
    );
  };
  const { encryptedEmail } = useParams<{
    encryptedEmail: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [treatmentHistory, setTreatmentHistory] = useState<any[]>([]);
  const [showTraiterSidebar, setShowTraiterSidebar] = useState(false);
  const [showModifierSidebar, setShowModifierSidebar] = useState(false);
  const [showActionSidebar, setShowActionSidebar] = useState(false);
  const [defaultActionTab, setDefaultActionTab] = useState<
    "modifier" | "traiter"
  >("modifier");
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Vérifier si le prospect est traité (existe dans prospects_traites)
  const isProspectTraite = React.useMemo(() => {
    if (!treatmentHistory || treatmentHistory.length === 0) return false;
    // Vérifier s'il y a au moins un traitement provenant de prospects_traites
    return treatmentHistory.some(
      (treatment) => treatment.isFromTraites === true
    );
  }, [treatmentHistory]);

  // Décrypter l'email depuis l'URL
  const email = React.useMemo(() => {
    if (!encryptedEmail) return "";
    return extractEmailFromUrl(encryptedEmail);
  }, [encryptedEmail]);

  useEffect(() => {
    // Configuration de la locale française pour moment.js
    moment.locale("fr");
    if (email) {
      fetchProspectDetails();
      fetchTreatmentHistory();
    }
  }, [email]);
  const fetchTreatmentHistory = async () => {
    if (!email) return;
    try {
      // Récupérer TOUS les historiques en parallèle
      const [
        assignmentsResult,
        traitesResult,
        rappelerResult,
        modificationsResult,
        validesResult,
        archivesResult,
      ] = await Promise.all([
        supabase.from("sales_assignments").select("*").eq("lead_email", email),
        supabase.from("prospects_traites").select("*").eq("lead_email", email),
        supabase
          .from("prospects_a_rappeler")
          .select("*")
          .eq("lead_email", email),
        supabase
          .from("prospect_modifications")
          .select("*")
          .eq("lead_email", email),
        supabase.from("prospects_valides").select("*").eq("lead_email", email),
        supabase.from("prospects_archives").select("*").eq("lead_email", email),
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;
      if (traitesResult.error) throw traitesResult.error;
      if (rappelerResult.error) throw rappelerResult.error;
      if (modificationsResult.error) throw modificationsResult.error;
      if (validesResult.error) throw validesResult.error;
      if (archivesResult.error) throw archivesResult.error;

      // Enrichir les assignments actifs avec les profiles
      const enrichedAssignments = await Promise.all(
        (assignmentsResult.data || []).map(async (assignment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", assignment.sales_user_id)
            .single();

          const { data: sdrProfile } = assignment.assigned_by
            ? await supabase
                .from("profiles")
                .select("first_name, last_name, email")
                .eq("id", assignment.assigned_by)
                .single()
            : { data: null };

          return {
            ...assignment,
            profiles: profile,
            sdr_profile: sdrProfile,
            isFromTraites: false,
            isFromRappeler: false,
            isFromModification: false,
            isFromValides: false,
            isFromArchives: false,
            display_date: assignment.created_at,
            type: "assignment",
          };
        })
      );

      // Enrichir les prospects traités SDR avec les profiles
      const enrichedTraites = await Promise.all(
        (traitesResult.data || []).map(async (traite) => {
          const { data: sdrProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", traite.sdr_id)
            .single();

          return {
            ...traite,
            profiles: sdrProfile,
            isFromTraites: true,
            isFromRappeler: false,
            isFromModification: false,
            isFromValides: false,
            isFromArchives: false,
            display_date: traite.completed_at,
            type: "traite_sdr",
          };
        })
      );

      // Enrichir les prospects à rappeler avec les profiles
      const enrichedRappeler = await Promise.all(
        (rappelerResult.data || []).map(async (rappel) => {
          const { data: sdrProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", rappel.sdr_id)
            .single();

          return {
            ...rappel,
            profiles: sdrProfile,
            isFromTraites: false,
            isFromRappeler: true,
            isFromModification: false,
            isFromValides: false,
            isFromArchives: false,
            display_date: rappel.assigned_at,
            type: "rappeler_sdr",
          };
        })
      );

      // Enrichir les prospects validés SALES avec RDV
      const enrichedValides = await Promise.all(
        (validesResult.data || []).map(async (valide) => {
          const { data: salesProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", valide.validated_by)
            .single();

          const { data: sdrProfile } = valide.sdr_id
            ? await supabase
                .from("profiles")
                .select("first_name, last_name, email")
                .eq("id", valide.sdr_id)
                .single()
            : { data: null };

          return {
            ...valide,
            profiles: salesProfile,
            sdr_profile: sdrProfile,
            isFromTraites: false,
            isFromRappeler: false,
            isFromModification: false,
            isFromValides: true,
            isFromArchives: false,
            display_date: valide.validated_at,
            type: "valide_sales",
          };
        })
      );

      // Enrichir les prospects rejetés/archivés SALES
      const enrichedArchives = await Promise.all(
        (archivesResult.data || []).map(async (archive) => {
          const { data: salesProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", archive.rejected_by)
            .single();

          const { data: sdrProfile } = archive.sdr_id
            ? await supabase
                .from("profiles")
                .select("first_name, last_name, email")
                .eq("id", archive.sdr_id)
                .single()
            : { data: null };

          return {
            ...archive,
            profiles: salesProfile,
            sdr_profile: sdrProfile,
            isFromTraites: false,
            isFromRappeler: false,
            isFromModification: false,
            isFromValides: false,
            isFromArchives: true,
            display_date: archive.rejected_at,
            type: "archive_sales",
          };
        })
      );

      // Enrichir les modifications avec les profiles
      const enrichedModifications = await Promise.all(
        (modificationsResult.data || []).map(async (modification) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", modification.modified_by)
            .single();

          return {
            ...modification,
            profiles: profile,
            isFromTraites: false,
            isFromRappeler: false,
            isFromModification: true,
            isFromValides: false,
            isFromArchives: false,
            display_date: modification.modified_at,
            type: "modification",
          };
        })
      );

      // Combiner et trier par date (plus récent en premier)
      const allHistory = [
        ...enrichedAssignments,
        ...enrichedTraites,
        ...enrichedRappeler,
        ...enrichedValides,
        ...enrichedArchives,
        ...enrichedModifications,
      ].sort((a, b) => {
        const dateA = new Date(a.display_date).getTime();
        const dateB = new Date(b.display_date).getTime();
        return dateB - dateA;
      });

      setTreatmentHistory(allHistory);
    } catch (error) {
      console.error("Error fetching treatment history:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'historique des traitements",
        variant: "destructive",
      });
    }
  };
  const fetchProspectDetails = async () => {
    if (!email) {
      console.error("No email found from encrypted URL");
      navigate("/prospects");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-contact", {
        body: {
          email: email, // Utiliser l'email décrypté
        },
      });
      if (error) throw error;
      if (data && data.success && data.data) {
        // Combiner toutes les données des différentes sources
        const combinedProspect: any = {
          email: email,
          // Utiliser l'email décrypté
          sources: data.data,
        };
        // Fusionner les données des différentes sources
        data.data.forEach((contact: any) => {
          Object.keys(contact.data).forEach((key) => {
            const value = contact.data[key];
            // On prend la valeur si elle n'est pas nulle/vide et qu'on n'a pas déjà une valeur non-nulle
            if (value !== null && value !== "" && value !== undefined) {
              if (
                !combinedProspect[key] ||
                combinedProspect[key] === null ||
                combinedProspect[key] === "" ||
                combinedProspect[key] === undefined
              ) {
                combinedProspect[key] = value;
              }
            }
          });
        });
        setProspect(combinedProspect);
      } else {
        toast({
          title: "Erreur",
          description: "Prospect non trouvé",
          variant: "destructive",
        });
        navigate("/prospects");
      }
    } catch (error) {
      console.error("Error fetching prospect details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du prospect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const getInitials = (
    firstName?: string,
    lastName?: string,
    email?: string
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };
  const getDisplayName = () => {
    const firstName =
      prospect?.first_name ||
      prospect?.crm_firstname ||
      prospect?.apollo_firstname;
    const lastName =
      prospect?.last_name || prospect?.crm_name || prospect?.apollo_lastname;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return prospect?.email || "Utilisateur";
  };
  const getCompanyName = () => {
    return (
      prospect?.company ||
      prospect?.crm_company ||
      prospect?.apollo_company ||
      "Non renseigné"
    );
  };
  const getCity = () => {
    return prospect?.city || prospect?.crm_city || "Non renseigné";
  };
  const getPhone = () => {
    return (
      prospect?.mobile_phone ||
      prospect?.crm_mobile ||
      prospect?.apollo_mobile ||
      prospect?.work_direct_phone ||
      prospect?.apollo_phone ||
      "Non renseigné"
    );
  };
  const getLinkedInUrl = () => {
    return (
      prospect?.person_linkedin_url ||
      prospect?.crm_linkedin_url ||
      prospect?.apollo_linkedin_url
    );
  };
  const getWebsite = () => {
    return prospect?.website || prospect?.apollo_website;
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Prospect non trouvé</p>
        <Button onClick={() => navigate("/prospects")} className="mt-4">
          Retour aux prospects
        </Button>
      </div>
    );
  }
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <motion.div
        className="flex-1 p-6 space-y-6"
        animate={{
          marginRight: showActionSidebar ? "480px" : "0px", // 480px pour le sidebar plus large
        }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/prospects");
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">{prospect.email}</h1>
                <p className="text-muted-foreground">Contact CRM</p>
              </div>
              {isProspectTraite && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200/80"
                >
                  Prospect Traité
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => {
                setDefaultActionTab("modifier");
                setShowActionSidebar(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {!isProspectTraite && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setDefaultActionTab("traiter");
                  setShowActionSidebar(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Traiter
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                  {getInitials(
                    prospect.first_name ||
                      prospect.crm_firstname ||
                      prospect.apollo_firstname,
                    prospect.last_name ||
                      prospect.crm_name ||
                      prospect.apollo_lastname,
                    prospect.email
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{prospect.email}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Building2 className="h-4 w-4" />
                  <span>{getCompanyName()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{getCity()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CRM Contacts - Contact Principal */}
        {prospect.sources?.find((s) => s.source_table === "crm_contacts") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                CRM Contacts - Contact Principal
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm bg-success/10 text-success px-3 py-1.5 rounded-full w-fit">
                    <User className="h-4 w-4" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Email:
                    </span>
                    <a
                      href={`mailto:${prospect.email}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {prospect.email}
                    </a>
                  </div>
                  {(prospect.first_name ||
                    prospect.crm_firstname ||
                    prospect.firstname) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Prénom:
                      </span>
                      <span className="text-sm">
                        {prospect.first_name ||
                          prospect.crm_firstname ||
                          prospect.firstname}
                      </span>
                    </div>
                  )}
                  {(prospect.last_name ||
                    prospect.crm_name ||
                    prospect.name) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Nom:
                      </span>
                      <span className="text-sm">
                        {prospect.last_name ||
                          prospect.crm_name ||
                          prospect.name}
                      </span>
                    </div>
                  )}
                  {getPhone() !== "Non renseigné" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Téléphone:
                      </span>
                      <a
                        href={`tel:${getPhone()}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {getPhone()}
                      </a>
                    </div>
                  )}
                  {(prospect.tel ||
                    prospect.crm_mobile ||
                    prospect.mobile ||
                    prospect.tel_pro) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Tél. fixe:
                      </span>
                      <a
                        href={`tel:${
                          prospect.tel ||
                          prospect.crm_mobile ||
                          prospect.mobile ||
                          prospect.tel_pro
                        }`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {prospect.tel ||
                          prospect.crm_mobile ||
                          prospect.mobile ||
                          prospect.tel_pro}
                      </a>
                    </div>
                  )}
                  {(prospect.mobile ||
                    prospect.crm_mobile ||
                    prospect.mobile_phone) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Mobile:
                      </span>
                      <a
                        href={`tel:${
                          prospect.mobile ||
                          prospect.crm_mobile ||
                          prospect.mobile_phone
                        }`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {prospect.mobile ||
                          prospect.crm_mobile ||
                          prospect.mobile_phone}
                      </a>
                    </div>
                  )}
                  {prospect.mobile_2 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Mobile 2:
                      </span>
                      <a
                        href={`tel:${prospect.mobile_2}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {prospect.mobile_2}
                      </a>
                    </div>
                  )}
                  {prospect.tel_pro && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Tél. pro:
                      </span>
                      <a
                        href={`tel:${prospect.tel_pro}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {prospect.tel_pro}
                      </a>
                    </div>
                  )}
                  {prospect.address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Adresse:
                      </span>
                      <span className="text-sm">{prospect.address}</span>
                    </div>
                  )}
                  {prospect.departement && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Département:
                      </span>
                      <span className="text-sm">{prospect.departement}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Entreprise */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm bg-warning/10 text-warning px-3 py-1.5 rounded-full w-fit">
                    <Building2 className="h-4 w-4" />
                    Entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Entreprise:
                    </span>
                    <span className="text-sm">{getCompanyName()}</span>
                  </div>
                  {(prospect.industrie ||
                    prospect.industry ||
                    prospect.apollo_industry) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Industrie:
                      </span>
                      <span className="text-sm">
                        {prospect.industrie ||
                          prospect.industry ||
                          prospect.apollo_industry}
                      </span>
                    </div>
                  )}
                  {(prospect.nb_employees || prospect.apollo_nb_employees) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Nb employés:
                      </span>
                      <span className="text-sm">
                        {prospect.nb_employees || prospect.apollo_nb_employees}
                      </span>
                    </div>
                  )}
                  {prospect.linkedin_function && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Fonction LinkedIn:
                      </span>
                      <span className="text-sm">
                        {prospect.linkedin_function}
                      </span>
                    </div>
                  )}
                  {(prospect.company_website ||
                    prospect.website ||
                    prospect.apollo_website) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Site web:
                      </span>
                      <a
                        href={
                          prospect.company_website ||
                          prospect.website ||
                          prospect.apollo_website
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {prospect.company_website ||
                          prospect.website ||
                          prospect.apollo_website}
                      </a>
                    </div>
                  )}
                  {(prospect.linkedin_company_url ||
                    prospect.apollo_company_linkedin_url) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        LinkedIn entreprise:
                      </span>
                      <a
                        href={
                          prospect.linkedin_company_url ||
                          prospect.apollo_company_linkedin_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        LinkedIn entreprise
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Apollo Contacts - Données Additionnelles */}
        {prospect.sources?.find(
          (s) => s.source_table === "apollo_contacts"
        ) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                Apollo Contacts - Données Additionnelles
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles Apollo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm bg-green-600/10 px-3 py-1.5 rounded-full w-fit text-green-500">
                    <User className="h-4 w-4" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Email:
                    </span>
                    <a
                      href={`mailto:${prospect.email}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {prospect.email}
                    </a>
                  </div>
                  {prospect.apollo_firstname && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Prénom:
                      </span>
                      <span className="text-sm">
                        {prospect.apollo_firstname}
                      </span>
                    </div>
                  )}
                  {prospect.apollo_lastname && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Nom:
                      </span>
                      <span className="text-sm">
                        {prospect.apollo_lastname}
                      </span>
                    </div>
                  )}
                  {(prospect.title || prospect.apollo_title) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Titre:
                      </span>
                      <span className="text-sm">
                        {prospect.title || prospect.apollo_title}
                      </span>
                    </div>
                  )}
                  {prospect.apollo_seniority && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Ancienneté:
                      </span>
                      <span className="text-sm">
                        {prospect.apollo_seniority}
                      </span>
                    </div>
                  )}
                  {getLinkedInUrl() && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        URL LinkedIn personnel:
                      </span>
                      <a
                        href={getLinkedInUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Profil LinkedIn
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Entreprise Apollo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit">
                    <Building2 className="h-4 w-4" />
                    Entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Entreprise:
                    </span>
                    <span className="text-sm">{getCompanyName()}</span>
                  </div>
                  {(prospect.industry || prospect.apollo_industry) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Industrie:
                      </span>
                      <span className="text-sm">
                        {prospect.industry || prospect.apollo_industry}
                      </span>
                    </div>
                  )}
                  {getWebsite() && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Site web:
                      </span>
                      <a
                        href={getWebsite()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {getWebsite()}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Ville entreprise:
                    </span>
                    <span className="text-sm">{getCity()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Pays entreprise:
                    </span>
                    <span className="text-sm">
                      {prospect.country || "France"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm bg-secondary/10 text-secondary px-3 py-1.5 rounded-full w-fit">
                <Phone className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Ville:</span>
                <span className="text-sm">{getCity()}</span>
              </div>
              {(prospect.country || prospect.crm_country) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Pays:</span>
                  <span className="text-sm">
                    {prospect.country || prospect.crm_country}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Autres informations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm bg-accent text-slate-500 px-3 py-1.5 rounded-full w-fit">
                <Mail className="h-4 w-4" />
                Autres informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.apollo_email_status && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Email unique:
                  </span>
                  <Badge
                    variant={
                      prospect.apollo_email_status === "Verified"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {prospect.apollo_email_status === "Verified"
                      ? "Oui"
                      : "Non"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section HubSpot - Pleine largeur */}
        {(() => {
          console.log(
            "🚀 Debug HubSpot - Tentative d'affichage de la section HubSpot"
          );
          console.log("🚀 Debug HubSpot - Prospect object:", prospect);
          return renderHubSpotData(prospect, "Informations dans HubSpot");
        })()}

        {/* Plateforme & Intégrations */}
        {(prospect.sources?.find((s) => s.source_table === "apollo_contacts")
          ?.data.apollo_contact_id ||
          prospect.sources?.find((s) => s.source_table === "apollo_contacts")
            ?.data.apollo_account_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm bg-warning/10 text-warning px-3 py-1.5 rounded-full w-fit">
                <Building2 className="h-4 w-4" />
                Plateforme & Intégrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.sources?.find(
                (s) => s.source_table === "apollo_contacts"
              )?.data.apollo_contact_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    ID contact Apollo:
                  </span>
                  <span className="text-xs font-mono">
                    {
                      prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.apollo_contact_id
                    }
                  </span>
                </div>
              )}
              {prospect.sources?.find(
                (s) => s.source_table === "apollo_contacts"
              )?.data.apollo_account_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    ID compte Apollo:
                  </span>
                  <span className="text-xs font-mono">
                    {
                      prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.apollo_account_id
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activité & Engagement */}
        {(prospect.sources?.find((s) => s.source_table === "apollo_contacts")
          ?.data.email_sent !== undefined ||
          prospect.sources?.find((s) => s.source_table === "apollo_contacts")
            ?.data.email_open !== undefined ||
          prospect.sources?.find((s) => s.source_table === "apollo_contacts")
            ?.data.replied !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-success/10 text-success px-3 py-1.5 rounded-full w-fit">
                  <Mail className="h-4 w-4" />
                  Activité & Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prospect.sources?.find(
                  (s) => s.source_table === "apollo_contacts"
                )?.data.email_sent !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Email envoyé:
                    </span>
                    <Badge
                      variant={
                        prospect.sources?.find(
                          (s) => s.source_table === "apollo_contacts"
                        )?.data.email_sent
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.email_sent
                        ? "Oui"
                        : "Non"}
                    </Badge>
                  </div>
                )}
                {prospect.sources?.find(
                  (s) => s.source_table === "apollo_contacts"
                )?.data.email_open !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Email ouvert:
                    </span>
                    <Badge
                      variant={
                        prospect.sources?.find(
                          (s) => s.source_table === "apollo_contacts"
                        )?.data.email_open
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.email_open
                        ? "Oui"
                        : "Non"}
                    </Badge>
                  </div>
                )}
                {prospect.sources?.find(
                  (s) => s.source_table === "apollo_contacts"
                )?.data.replied !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Email répliqué:
                    </span>
                    <Badge
                      variant={
                        prospect.sources?.find(
                          (s) => s.source_table === "apollo_contacts"
                        )?.data.replied
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.replied
                        ? "Oui"
                        : "Non"}
                    </Badge>
                  </div>
                )}
                {prospect.sources?.find(
                  (s) => s.source_table === "apollo_contacts"
                )?.data.demoed !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Démo effectuée:
                    </span>
                    <Badge
                      variant={
                        prospect.sources?.find(
                          (s) => s.source_table === "apollo_contacts"
                        )?.data.demoed
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {prospect.sources?.find(
                        (s) => s.source_table === "apollo_contacts"
                      )?.data.demoed
                        ? "Oui"
                        : "Non"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statut & Suivi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm bg-danger/10 text-danger px-3 py-1.5 rounded-full w-fit">
                  <User className="h-4 w-4" />
                  Statut & Suivi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prospect.apollo_email_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Statut email:
                    </span>
                    <Badge
                      variant={
                        prospect.apollo_email_status === "Verified"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {prospect.apollo_email_status}
                    </Badge>
                  </div>
                )}
                {prospect.apollo_stage && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Étape:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {prospect.apollo_stage}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations techniques */}
        {prospect.sources?.find((s) => s.source_table === "apollo_contacts")
          ?.data.technologies && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit">
                <Building2 className="h-4 w-4" />
                Informations techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-muted-foreground text-sm block mb-3">
                  Technologies:
                </span>
                <div className="flex flex-wrap gap-2">
                  {prospect.sources
                    ?.find((s) => s.source_table === "apollo_contacts")
                    ?.data.technologies.split(",")
                    .map((tech: string, index: number) => {
                      const TechIcon = getTechIcon(tech);
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          <TechIcon className="h-3 w-3" />
                          {tech.trim()}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique des traitements */}
        {treatmentHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm bg-blue-500/10 px-3 py-1.5 rounded-full w-fit text-blue-500">
                  <FileText className="h-4 w-4" />
                  Historique des traitements ({treatmentHistory.length})
                </div>
                {treatmentHistory.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {showAllHistory ? "Voir moins" : "Voir plus"}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {(showAllHistory
                  ? treatmentHistory
                  : treatmentHistory.slice(0, 3)
                ).map((treatment, index) => (
                  <motion.div
                    key={treatment.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                    }}
                    className="border-l-2 border-blue-200 pl-4 pb-4 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              treatment.isFromValides
                                ? "default"
                                : treatment.isFromArchives
                                ? "destructive"
                                : treatment.isFromTraites
                                ? "default"
                                : treatment.isFromRappeler
                                ? "outline"
                                : treatment.isFromModification
                                ? "outline"
                                : "secondary"
                            }
                            className={
                              treatment.isFromValides
                                ? "text-xs bg-green-600"
                                : treatment.isFromArchives
                                ? "text-xs"
                                : treatment.isFromRappeler
                                ? "text-xs bg-orange-100 text-orange-800 border-orange-200"
                                : treatment.isFromModification
                                ? "text-xs bg-blue-100 text-blue-800 border-blue-200"
                                : "text-xs"
                            }
                          >
                            {treatment.isFromValides
                              ? "Validé Sales - RDV Programmé"
                              : treatment.isFromArchives
                              ? "Rejeté Sales"
                              : treatment.isFromTraites
                              ? "Traité SDR"
                              : treatment.isFromRappeler
                              ? "À rappeler SDR"
                              : treatment.isFromModification
                              ? "Modification"
                              : treatment.custom_data?.status ||
                                treatment.status}
                          </Badge>
                          {treatment.boucle && (
                            <Badge
                              variant="destructive"
                              className="text-xs bg-red-100 text-red-800 border-red-200"
                            >
                              Bouclé
                            </Badge>
                          )}
                          {treatment.custom_data?.import_source && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                            >
                              Importé: {treatment.custom_data.import_source}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {moment(
                              treatment.display_date || treatment.created_at
                            ).format("DD MMM YYYY, HH:mm")}
                          </span>
                        </div>

                        {/* Notes pour les assignments actifs */}
                        {treatment.custom_data?.sales_note &&
                          !treatment.isFromTraites &&
                          !treatment.isFromRappeler &&
                          !treatment.isFromModification && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Note :</strong>{" "}
                              {treatment.custom_data.sales_note}
                            </p>
                          )}

                        {/* Notes pour les prospects traités */}
                        {treatment.notes_sales && treatment.isFromTraites && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Note :</strong> {treatment.notes_sales}
                          </p>
                        )}

                        {/* Notes pour les prospects à rappeler */}
                        {treatment.notes_sales && treatment.isFromRappeler && (
                          <p className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                            <strong>Note :</strong> {treatment.notes_sales}
                          </p>
                        )}

                        {/* Statuts importés */}
                        {treatment.custom_data?.status_history &&
                          Object.keys(treatment.custom_data.status_history)
                            .length > 0 && (
                            <div className="mt-2 p-3 bg-muted rounded border">
                              <p className="text-xs font-medium mb-2 text-muted-foreground">
                                Statuts importés:
                              </p>
                              <div className="space-y-1">
                                {Object.entries(
                                  treatment.custom_data.status_history
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="text-xs flex justify-between"
                                  >
                                    <span className="font-medium text-muted-foreground">
                                      {key}:
                                    </span>
                                    <span className="text-foreground">
                                      {String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {treatment.custom_data.imported_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Importé le:{" "}
                                  {moment(
                                    treatment.custom_data.imported_at
                                  ).format("DD MMM YYYY à HH:mm")}
                                </p>
                              )}
                            </div>
                          )}

                        {/* Prospects validés SALES avec RDV */}
                        {treatment.isFromValides && (
                          <div className="space-y-2">
                            <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
                              <div className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Validé par: {
                                  treatment.profiles?.first_name
                                }{" "}
                                {treatment.profiles?.last_name}
                              </div>
                              {treatment.commentaire_validation && (
                                <p className="text-sm mb-2">
                                  <strong>Commentaire :</strong>{" "}
                                  {treatment.commentaire_validation}
                                </p>
                              )}
                              {treatment.rdv_date && (
                                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                  <span>📅 RDV programmé le:</span>
                                  <span>
                                    {moment(treatment.rdv_date).format(
                                      "DD MMM YYYY à HH:mm"
                                    )}
                                  </span>
                                </div>
                              )}
                              {treatment.rdv_notes && (
                                <p className="text-sm mt-2 italic text-green-700">
                                  Notes RDV: {treatment.rdv_notes}
                                </p>
                              )}
                              {treatment.sdr_profile && (
                                <p className="text-xs mt-2 text-muted-foreground">
                                  Traité initialement par SDR:{" "}
                                  {treatment.sdr_profile.first_name}{" "}
                                  {treatment.sdr_profile.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Prospects rejetés SALES */}
                        {treatment.isFromArchives && (
                          <div className="space-y-2">
                            <div className="text-sm bg-red-50 p-3 rounded border border-red-200">
                              <div className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Rejeté par: {
                                  treatment.profiles?.first_name
                                }{" "}
                                {treatment.profiles?.last_name}
                              </div>
                              {treatment.commentaire_rejet && (
                                <p className="text-sm mb-2">
                                  <strong>Commentaire :</strong>{" "}
                                  {treatment.commentaire_rejet}
                                </p>
                              )}
                              {treatment.raison_rejet && (
                                <p className="text-sm text-red-700">
                                  <strong>Raison :</strong>{" "}
                                  {treatment.raison_rejet}
                                </p>
                              )}
                              {treatment.sdr_profile && (
                                <p className="text-xs mt-2 text-muted-foreground">
                                  Traité initialement par SDR:{" "}
                                  {treatment.sdr_profile.first_name}{" "}
                                  {treatment.sdr_profile.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Champs modifiés */}
                        {treatment.modified_fields &&
                          treatment.isFromModification && (
                            <div className="text-sm bg-blue-50 p-2 rounded">
                              <strong className="block mb-1">
                                Champs modifiés :
                              </strong>
                              <div className="space-y-1">
                                {Object.entries(treatment.modified_fields).map(
                                  ([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {String(value)}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Statut pour les prospects traités */}
                        {treatment.statut_prospect &&
                          treatment.isFromTraites && (
                            <div className="text-xs">
                              <Badge variant="outline" className="text-xs">
                                {treatment.statut_prospect}
                              </Badge>
                            </div>
                          )}

                        {/* Statut pour les prospects à rappeler */}
                        {treatment.statut_prospect &&
                          treatment.isFromRappeler && (
                            <div className="text-xs">
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-800 border-orange-200"
                              >
                                {treatment.statut_prospect}
                              </Badge>
                            </div>
                          )}

                        <div className="text-xs text-muted-foreground space-y-1">
                          {treatment.custom_data?.action_date &&
                            !treatment.isFromTraites &&
                            !treatment.isFromRappeler &&
                            !treatment.isFromModification && (
                              <div>
                                <strong>Date d'action :</strong>{" "}
                                {moment(
                                  treatment.custom_data.action_date
                                ).fromNow()}
                              </div>
                            )}
                          {treatment.date_action && treatment.isFromTraites && (
                            <div>
                              <strong>Date d'action :</strong>{" "}
                              {moment(treatment.date_action).fromNow()}
                            </div>
                          )}
                          {treatment.date_action &&
                            treatment.isFromRappeler && (
                              <div>
                                <strong>Date d'action :</strong>{" "}
                                {moment(treatment.date_action).fromNow()}
                              </div>
                            )}
                          {treatment.custom_data?.callback_date &&
                            !treatment.isFromTraites &&
                            !treatment.isFromRappeler &&
                            !treatment.isFromModification && (
                              <div>
                                <strong>Date de rappel :</strong>{" "}
                                {moment(
                                  treatment.custom_data.callback_date
                                ).fromNow()}
                              </div>
                            )}
                          {treatment.callback_date &&
                            treatment.isFromRappeler && (
                              <div>
                                <strong>Date de rappel :</strong>{" "}
                                {moment(treatment.callback_date).fromNow()}
                              </div>
                            )}
                          {treatment.profiles && (
                            <div>
                              <strong>
                                {treatment.isFromModification
                                  ? "Modifié par"
                                  : "Traité par"}{" "}
                                :
                              </strong>{" "}
                              {treatment.profiles.first_name}{" "}
                              {treatment.profiles.last_name}(
                              {treatment.profiles.email})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index <
                      (showAllHistory
                        ? treatmentHistory
                        : treatmentHistory.slice(0, 3)
                      ).length -
                        1 && <hr className="mt-4 border-gray-200" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {/* Section HubSpot si disponible */}
        {prospect && renderHubSpotData(prospect)}

        {/* Dates importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm bg-orange-500/10 px-3 py-1.5 rounded-full w-fit text-orange-400">
              <User className="h-4 w-4" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prospect.sources?.find((s) => s.source_table === "crm_contacts")
              ?.data.created_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Date de création:
                </span>
                <span className="text-sm">
                  {moment(
                    prospect.sources?.find(
                      (s) => s.source_table === "crm_contacts"
                    )?.data.created_at
                  ).format("DD MMM YYYY, HH:mm")}
                </span>
              </div>
            )}
            {prospect.sources?.find((s) => s.source_table === "crm_contacts")
              ?.data.updated_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Mise à jour il y a:
                </span>
                <span className="text-sm">
                  {moment(
                    prospect.sources?.find(
                      (s) => s.source_table === "crm_contacts"
                    )?.data.updated_at
                  ).format("DD MMM YYYY, HH:mm")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sidebar Actions Prospect */}
      <AnimatePresence>
        {showActionSidebar && (
          <ProspectActionSidebar
            prospect={prospect}
            prospectEmail={email}
            defaultTab={defaultActionTab}
            onSuccess={() => {
              fetchProspectDetails();
              fetchTreatmentHistory();
              setShowActionSidebar(false);
            }}
            onClose={() => setShowActionSidebar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default ProspectDetails;
