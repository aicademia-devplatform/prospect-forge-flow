/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ArrowLeft, X, Columns3 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ColumnMapperProps {
  data: {
    headers: string[];
    rows: any[];
    fileName: string;
  };
  targetTable: "crm_contacts" | "apollo_contacts" | "prospects";
  onBack: () => void;
  onNext: (mapping: Record<string, string>) => void;
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

  // Traduction des noms de champs en français
  const fieldLabels: Record<string, string> = {
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
    secondary_email_verification_source: "Source Vérification Email Secondaire",
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
  };

  // Champs disponibles selon la table cible
  const targetFields: Record<string, string[]> = {
    crm_contacts: [
      "email",
      "firstname",
      "name",
      "company",
      "mobile",
      "tel",
      "tel_pro",
      "address",
      "city",
      "departement",
      "country",
      "linkedin_url",
      "linkedin_company_url",
      "company_website",
      "industrie",
      "nb_employees",
      "zoho_status",
      "apollo_status",
      "data_section",
      "linkedin_function",
      "mobile_2",
      "full_name",
      "contact_active",
      "systemeio_list",
      "apollo_list",
      "brevo_tag",
      "zoho_tag",
      "arlynk_status",
      "aicademia_high_status",
      "aicademia_low_status",
    ],
    prospects: [
      // Champs d'assignation (pour sales_assignments / prospects_traites)
      "lead_email",
      "notes_sales",
      "statut_prospect",
      "date_action",
      // Champs de contact (qui vont dans crm_contacts)
      "firstname",
      "name",
      "company",
      "mobile",
      "tel",
      "tel_pro",
      "address",
      "city",
      "departement",
      "country",
      "linkedin_url",
      "linkedin_company_url",
      "company_website",
      "industrie",
      "nb_employees",
      "linkedin_function",
      "mobile_2",
      "full_name",
      "contact_active",
      "systemeio_list",
      "apollo_list",
      "brevo_tag",
      "zoho_tag",
      "zoho_status",
      "apollo_status",
      "arlynk_status",
      "aicademia_high_status",
      "aicademia_low_status",
      "data_section",
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
    // Mapping automatique basé sur les noms de colonnes
    const autoMapping: Record<string, string> = {};
    data.headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, "_");
      if (fields.includes(normalizedHeader)) {
        autoMapping[header] = normalizedHeader;
      }
    });
    setMapping(autoMapping);
  }, [data.headers, targetTable]);

  const handleMappingChange = (csvColumn: string, targetColumn: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvColumn]: targetColumn,
    }));
  };

  const getMappedCount = () => {
    return Object.values(mapping).filter((v) => v && v !== "ignore").length;
  };

  const handleNext = () => {
    if (getMappedCount() === 0) {
      return;
    }
    onNext(mapping);
  };

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
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{header}</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exemple: {data.rows[0]?.[index] || "N/A"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <Select
                      value={mapping[header] || "ignore"}
                      onValueChange={(value) =>
                        handleMappingChange(header, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un champ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">
                          <span className="text-muted-foreground">
                            Ignorer cette colonne
                          </span>
                        </SelectItem>
                        {fields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {fieldLabels[field] || field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                Continuer
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
