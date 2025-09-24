import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Download, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ExternalLink, MoreHorizontal, X, ChevronDown, Settings, ArrowRight, ArrowLeftRight, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataPagination from './DataPagination';
import { useTableData } from '@/hooks/useTableData';
import { useTableSections } from '@/hooks/useTableSections';
import { useDebounce } from '@/hooks/useDebounce';
interface TableViewProps {
  tableName: 'apollo_contacts' | 'crm_contacts';
  onBack: () => void;
}
interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}
// Fonction de traduction des noms de colonnes
const translateColumnName = (columnName: string): string => {
  const translations: Record<string, string> = {
    // Colonnes communes
    'id': 'ID',
    'email': 'Email',
    'created_at': 'Date de création',
    'updated_at': 'Date de mise à jour',
    
    // Colonnes Apollo
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'company': 'Entreprise',
    'title': 'Titre',
    'seniority': 'Ancienneté',
    'departments': 'Départements',
    'activity': 'Activité',
    'lifecycle_stage': 'Étape du cycle de vie',
    'categorie_fonction': 'Catégorie fonction',
    'stage': 'Étape',
    'technologies': 'Technologies',
    'secteur_activite': 'Secteur d\'activité',
    'company_phone': 'Téléphone entreprise',
    'company_country': 'Pays entreprise',
    'company_state': 'État entreprise',
    'company_city': 'Ville entreprise',
    'company_address': 'Adresse entreprise',
    'country': 'Pays',
    'state': 'État',
    'city': 'Ville',
    'twitter_url': 'URL Twitter',
    'facebook_url': 'URL Facebook',
    'company_linkedin_url': 'URL LinkedIn entreprise',
    'website': 'Site web',
    'person_linkedin_url': 'URL LinkedIn personne',
    'subsidiary_of': 'Filiale de',
    'statut': 'Statut',
    'contact_owner': 'Propriétaire contact',
    'account_owner': 'Propriétaire compte',
    'work_direct_phone': 'Téléphone professionnel direct',
    'home_phone': 'Téléphone domicile',
    'mobile_phone': 'Téléphone portable',
    'corporate_phone': 'Téléphone corporate',
    'other_phone': 'Autre téléphone',
    'region': 'Région',
    'industry': 'Industrie',
    'keywords': 'Mots-clés',
    'secondary_email': 'Email secondaire',
    'tertiary_email': 'Email tertiaire',
    'num_employees': 'Nombre d\'employés',
    'nb_employees': 'Nombre d\'employés',
    'annual_revenue': 'Chiffre d\'affaires annuel',
    'total_funding': 'Financement total',
    'latest_funding': 'Dernier financement',
    'email_sent': 'Email envoyé',
    'email_open': 'Email ouvert',
    'email_bounced': 'Email rejeté',
    'replied': 'Répondu',
    'demoed': 'Démo effectuée',
    'apollo_account_id': 'ID compte Apollo',
    'apollo_contact_id': 'ID contact Apollo',
    'email_status': 'Statut email',
    'primary_email_source': 'Source email principal',
    'email_confidence': 'Confiance email',
    'last_sync_at': 'Dernière synchronisation',
    'primary_email_last_verified_at': 'Dernière vérification email principal',
    'last_raised_at': 'Dernière levée de fonds',
    'last_contacted': 'Dernier contact',
    
    // Colonnes CRM
    'firstname': 'Prénom',
    'name': 'Nom',
    'data_section': 'Section de données',
    'full_name': 'Nom complet',
    'email_domain': 'Domaine email',
    'contact_active': 'Contact actif',
    'tel': 'Téléphone',
    'mobile': 'Mobile',
    'mobile_2': 'Mobile 2',
    'tel_pro': 'Téléphone professionnel',
    'address': 'Adresse',
    'departement': 'Département',
    'linkedin_function': 'Fonction LinkedIn',
    'industrie': 'Industrie',
    'linkedin_url': 'URL LinkedIn',
    'linkedin_company_url': 'URL LinkedIn entreprise',
    'company_website': 'Site web entreprise',
    'systemeio_list': 'Liste Systeme.io',
    'apollo_list': 'Liste Apollo',
    'brevo_tag': 'Tag Brevo',
    'zoho_tag': 'Tag Zoho',
    'zoho_status': 'Statut Zoho',
    'apollo_status': 'Statut Apollo',
    'brevo_status': 'Statut Brevo',
    'hubspot_status': 'Statut HubSpot',
    'systemeio_status': 'Statut Systeme.io',
    'brevo_last_email': 'Dernier email Brevo',
    'brevo_last_opened': 'Dernière ouverture Brevo',
    'brevo_last_clicked': 'Dernier clic Brevo',
    'brevo_unsuscribe': 'Désabonnement Brevo',
    'brevo_open_number': 'Nombre d\'ouvertures Brevo',
    'brevo_click_number': 'Nombre de clics Brevo',
    'brevo_reply_number': 'Nombre de réponses Brevo',
    'hubspot_lead_status': 'Statut lead HubSpot',
    'hubspot_contact_owner': 'Propriétaire contact HubSpot',
    'hubspot_life_cycle_phase': 'Phase cycle de vie HubSpot',
    'hubspot_buy_role': 'Rôle d\'achat HubSpot',
    'hubspot_created_at': 'Créé le HubSpot',
    'hubspot_modified_at': 'Modifié le HubSpot',
    'hubspot_last_activity': 'Dernière activité HubSpot',
    'hubspot_notes': 'Notes HubSpot',
    'hubspot_anis_comment': 'Commentaire Anis HubSpot',
    'zoho_created_at': 'Créé le Zoho',
    'zoho_updated_at': 'Mis à jour le Zoho',
    'zoho_updated_by': 'Mis à jour par Zoho',
    'zoho_report_to': 'Rapport à Zoho',
    'zoho_description': 'Description Zoho',
    'zoho_last_activity': 'Dernière activité Zoho',
    'zoho_product_interest': 'Intérêt produit Zoho',
    'zoho_status_2': 'Statut 2 Zoho',
    'zoho_industrie_tag': 'Tag industrie Zoho'
  };
  
  return translations[columnName] || columnName;
};

const TableView: React.FC<TableViewProps> = ({
  tableName,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [columnSearchTerm, setColumnSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set(['email']));
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openColumnDropdown, setOpenColumnDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<Set<string>>(new Set());
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Memoize visible columns array to prevent infinite re-renders
  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);

  // Fetch data using server-side pagination
  const {
    data,
    totalCount,
    totalPages,
    loading
  } = useTableData({
    tableName,
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    sectionFilter: selectedSections.length > 0 ? selectedSections.join(',') : 'all',
    sortBy,
    sortOrder,
    visibleColumns: visibleColumnsArray
  });

  // Fetch available sections
  const {
    sections
  } = useTableSections(tableName);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll detection for pinned columns border
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const scrollLeft = tableContainerRef.current.scrollLeft;
        setIsScrolled(scrollLeft > 0);
      }
    };

    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => tableContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Filter sections based on search term
  const filteredSections = sections.filter(section => section.label.toLowerCase().includes(sectionSearchTerm.toLowerCase()));

  // Generate consistent colors for section badges
  const generateSectionColor = (sectionName: string) => {
    // Normalize the section name (case-insensitive, handle ARlynk/Arlynk)
    const normalizedName = sectionName.toLowerCase().trim();
    const finalName = normalizedName === 'arlynk' || normalizedName === 'arlynk' ? 'arlynk' : normalizedName;

    // Assign specific colors: Arlynk = Blue, Aicademia = Green
    if (finalName === 'arlynk') {
      return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300';
    } else if (finalName === 'aicademia') {
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300';
    }

    // Default fallback color
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300';
  };
  const toggleSection = (sectionValue: string) => {
    if (selectedSections.includes(sectionValue)) {
      setSelectedSections(selectedSections.filter(s => s !== sectionValue));
    } else {
      setSelectedSections([...selectedSections, sectionValue]);
    }
    setCurrentPage(1);
  };
  const removeSection = (sectionValue: string) => {
    setSelectedSections(selectedSections.filter(s => s !== sectionValue));
    setCurrentPage(1);
  };

  // Define columns based on table - get ALL columns from database
  const getAllColumns = (): ColumnInfo[] => {
    if (tableName === 'apollo_contacts') {
      return [{
        name: 'id',
        type: 'string',
        nullable: false
      }, {
        name: 'email',
        type: 'string',
        nullable: false
      }, {
        name: 'first_name',
        type: 'string',
        nullable: true
      }, {
        name: 'last_name',
        type: 'string',
        nullable: true
      }, {
        name: 'company',
        type: 'string',
        nullable: true
      }, {
        name: 'title',
        type: 'string',
        nullable: true
      }, {
        name: 'seniority',
        type: 'string',
        nullable: true
      }, {
        name: 'departments',
        type: 'string',
        nullable: true
      }, {
        name: 'activity',
        type: 'string',
        nullable: true
      }, {
        name: 'lifecycle_stage',
        type: 'string',
        nullable: true
      }, {
        name: 'categorie_fonction',
        type: 'string',
        nullable: true
      }, {
        name: 'stage',
        type: 'string',
        nullable: true
      }, {
        name: 'technologies',
        type: 'string',
        nullable: true
      }, {
        name: 'secteur_activite',
        type: 'string',
        nullable: true
      }, {
        name: 'company_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'company_country',
        type: 'string',
        nullable: true
      }, {
        name: 'company_state',
        type: 'string',
        nullable: true
      }, {
        name: 'company_city',
        type: 'string',
        nullable: true
      }, {
        name: 'company_address',
        type: 'string',
        nullable: true
      }, {
        name: 'country',
        type: 'string',
        nullable: true
      }, {
        name: 'state',
        type: 'string',
        nullable: true
      }, {
        name: 'city',
        type: 'string',
        nullable: true
      }, {
        name: 'twitter_url',
        type: 'string',
        nullable: true
      }, {
        name: 'facebook_url',
        type: 'string',
        nullable: true
      }, {
        name: 'company_linkedin_url',
        type: 'string',
        nullable: true
      }, {
        name: 'website',
        type: 'string',
        nullable: true
      }, {
        name: 'person_linkedin_url',
        type: 'string',
        nullable: true
      }, {
        name: 'subsidiary_of',
        type: 'string',
        nullable: true
      }, {
        name: 'statut',
        type: 'string',
        nullable: true
      }, {
        name: 'contact_owner',
        type: 'string',
        nullable: true
      }, {
        name: 'account_owner',
        type: 'string',
        nullable: true
      }, {
        name: 'work_direct_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'home_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'mobile_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'corporate_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'other_phone',
        type: 'string',
        nullable: true
      }, {
        name: 'region',
        type: 'string',
        nullable: true
      }, {
        name: 'industry',
        type: 'string',
        nullable: true
      }, {
        name: 'keywords',
        type: 'string',
        nullable: true
      }, {
        name: 'secondary_email',
        type: 'string',
        nullable: true
      }, {
        name: 'tertiary_email',
        type: 'string',
        nullable: true
      }, {
        name: 'num_employees',
        type: 'number',
        nullable: true
      }, {
        name: 'nb_employees',
        type: 'number',
        nullable: true
      }, {
        name: 'annual_revenue',
        type: 'number',
        nullable: true
      }, {
        name: 'total_funding',
        type: 'number',
        nullable: true
      }, {
        name: 'latest_funding',
        type: 'number',
        nullable: true
      }, {
        name: 'email_sent',
        type: 'boolean',
        nullable: true
      }, {
        name: 'email_open',
        type: 'boolean',
        nullable: true
      }, {
        name: 'email_bounced',
        type: 'boolean',
        nullable: true
      }, {
        name: 'replied',
        type: 'boolean',
        nullable: true
      }, {
        name: 'demoed',
        type: 'boolean',
        nullable: true
      }, {
        name: 'apollo_account_id',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_contact_id',
        type: 'string',
        nullable: true
      }, {
        name: 'email_status',
        type: 'string',
        nullable: true
      }, {
        name: 'primary_email_source',
        type: 'string',
        nullable: true
      }, {
        name: 'email_confidence',
        type: 'string',
        nullable: true
      }, {
        name: 'created_at',
        type: 'string',
        nullable: true
      }, {
        name: 'updated_at',
        type: 'string',
        nullable: true
      }, {
        name: 'last_sync_at',
        type: 'string',
        nullable: true
      }, {
        name: 'primary_email_last_verified_at',
        type: 'string',
        nullable: true
      }, {
        name: 'last_raised_at',
        type: 'string',
        nullable: true
      }, {
        name: 'last_contacted',
        type: 'string',
        nullable: true
      }];
    } else {
      return [{
        name: 'id',
        type: 'number',
        nullable: false
      }, {
        name: 'email',
        type: 'string',
        nullable: false
      }, {
        name: 'firstname',
        type: 'string',
        nullable: true
      }, {
        name: 'name',
        type: 'string',
        nullable: true
      }, {
        name: 'company',
        type: 'string',
        nullable: true
      }, {
        name: 'data_section',
        type: 'string',
        nullable: true
      }, {
        name: 'full_name',
        type: 'string',
        nullable: true
      }, {
        name: 'email_domain',
        type: 'string',
        nullable: true
      }, {
        name: 'contact_active',
        type: 'string',
        nullable: true
      }, {
        name: 'tel',
        type: 'string',
        nullable: true
      }, {
        name: 'mobile',
        type: 'string',
        nullable: true
      }, {
        name: 'mobile_2',
        type: 'string',
        nullable: true
      }, {
        name: 'tel_pro',
        type: 'string',
        nullable: true
      }, {
        name: 'address',
        type: 'string',
        nullable: true
      }, {
        name: 'city',
        type: 'string',
        nullable: true
      }, {
        name: 'departement',
        type: 'string',
        nullable: true
      }, {
        name: 'country',
        type: 'string',
        nullable: true
      }, {
        name: 'nb_employees',
        type: 'string',
        nullable: true
      }, {
        name: 'linkedin_function',
        type: 'string',
        nullable: true
      }, {
        name: 'industrie',
        type: 'string',
        nullable: true
      }, {
        name: 'linkedin_url',
        type: 'string',
        nullable: true
      }, {
        name: 'linkedin_company_url',
        type: 'string',
        nullable: true
      }, {
        name: 'company_website',
        type: 'string',
        nullable: true
      }, {
        name: 'systemeio_list',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_list',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_tag',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_tag',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_status',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_status',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_status',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_high_status',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_low_status',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_ma_score',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_crm_notation_score',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_score',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_score',
        type: 'string',
        nullable: true
      }, {
        name: 'total_score',
        type: 'number',
        nullable: true
      }, {
        name: 'apollo_email_verification',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_owner',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_last_contact',
        type: 'string',
        nullable: true
      }, {
        name: 'apollo_description',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_cold_status',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_cold_note',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_cold_action_date',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_cold_relance2',
        type: 'string',
        nullable: true
      }, {
        name: 'arlynk_cold_relance3',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_cold_status',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_cold_note',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_cold_action_date',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_cold_relance2',
        type: 'string',
        nullable: true
      }, {
        name: 'aicademia_cold_relance3',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_last_mail_campain',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_last_sms_campain',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_unsuscribe',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_open_number',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_click_number',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_reply_number',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_lead_status',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_contact_owner',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_life_cycle_phase',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_buy_role',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_created_at',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_modified_at',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_last_activity',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_notes',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_anis_comment',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_created_at',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_updated_at',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_updated_by',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_report_to',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_description',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_last_activity',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_product_interest',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_status_2',
        type: 'string',
        nullable: true
      }, {
        name: 'zoho_industrie_tag',
        type: 'string',
        nullable: true
      }, {
        name: 'created_at',
        type: 'string',
        nullable: true
      }, {
        name: 'updated_at',
        type: 'string',
        nullable: true
      }];
    }
  };
  const allColumns = getAllColumns();

  // Initialize visible columns and sync temp state
  useEffect(() => {
    const defaultColumns = ['id', 'email', 'firstname', 'name', 'first_name', 'last_name', 'company', 'data_section', 'created_at'];
    const toggleableColumns = allColumns.filter(col => col.name !== 'email' && col.name !== 'id').map(col => col.name);
    const initialVisible = toggleableColumns.filter(col => defaultColumns.includes(col));
    setVisibleColumns(new Set(initialVisible));
    setTempVisibleColumns(new Set(initialVisible));
    setTempColumnOrder(initialVisible);
  }, [tableName]);

  // Get columns that should be displayed - pinned columns first, then ordered visible columns
  const pinnedDisplayColumns = allColumns.filter(col => pinnedColumns.has(col.name) && (col.name === 'email' || col.name === 'id' || visibleColumns.has(col.name)));
  
  // Order the regular columns based on tempColumnOrder if in dialog, otherwise use current visible columns
  const getOrderedVisibleColumns = () => {
    const visibleColumnNames = Array.from(visibleColumns);
    const orderedColumns: string[] = [];
    
    // Add columns in the order specified by tempColumnOrder (if they're visible)
    tempColumnOrder.forEach(colName => {
      if (visibleColumnNames.includes(colName)) {
        orderedColumns.push(colName);
      }
    });
    
    // Add any remaining visible columns that weren't in the order
    visibleColumnNames.forEach(colName => {
      if (!orderedColumns.includes(colName)) {
        orderedColumns.push(colName);
      }
    });
    
    return orderedColumns;
  };
  
  const orderedVisibleColumns = getOrderedVisibleColumns();
  const regularDisplayColumns = allColumns.filter(col => !pinnedColumns.has(col.name) && orderedVisibleColumns.includes(col.name))
    .sort((a, b) => orderedVisibleColumns.indexOf(a.name) - orderedVisibleColumns.indexOf(b.name));
  
  const displayColumns = [...pinnedDisplayColumns, ...regularDisplayColumns];

  // Filter columns for search
  const filteredColumns = allColumns.filter(col => col.name !== 'email' && col.name !== 'id').filter(col => col.name.toLowerCase().includes(columnSearchTerm.toLowerCase()));
  const toggleColumnVisibility = (columnName: string) => {
    const newVisible = new Set(tempVisibleColumns);
    if (newVisible.has(columnName)) {
      newVisible.delete(columnName);
      // Remove from order when hiding
      setTempColumnOrder(prev => prev.filter(col => col !== columnName));
    } else {
      newVisible.add(columnName);
      // Add to end of order when showing
      setTempColumnOrder(prev => [...prev, columnName]);
    }
    setTempVisibleColumns(newVisible);
  };

  const moveColumnUp = (columnName: string) => {
    setTempColumnOrder(prev => {
      const currentIndex = prev.indexOf(columnName);
      if (currentIndex > 0) {
        const newOrder = [...prev];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
        return newOrder;
      }
      return prev;
    });
  };

  const moveColumnDown = (columnName: string) => {
    setTempColumnOrder(prev => {
      const currentIndex = prev.indexOf(columnName);
      if (currentIndex < prev.length - 1 && currentIndex >= 0) {
        const newOrder = [...prev];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
        return newOrder;
      }
      return prev;
    });
  };

  const openColumnDialog = () => {
    setTempVisibleColumns(new Set(visibleColumns));
    setTempColumnOrder(getOrderedVisibleColumns());
    setColumnDialogOpen(true);
  };

  const applyColumnChanges = () => {
    setVisibleColumns(new Set(tempVisibleColumns));
    // Update the actual column order for future use
    const newOrder = tempColumnOrder.filter(col => tempVisibleColumns.has(col));
    setTempColumnOrder(newOrder);
    setColumnDialogOpen(false);
  };

  const cancelColumnChanges = () => {
    setTempVisibleColumns(new Set(visibleColumns));
    setTempColumnOrder(getOrderedVisibleColumns());
    setColumnDialogOpen(false);
  };

  const toggleColumnPin = (columnName: string) => {
    const newPinned = new Set<string>();
    
    // If the column is already pinned, unpin it
    if (pinnedColumns.has(columnName)) {
      // Unpin the column (no columns will be pinned)
      setPinnedColumns(newPinned);
    } else {
      // Pin only the new column (automatically unpins any previously pinned column)
      newPinned.add(columnName);
      setPinnedColumns(newPinned);
    }
  };

  const handleColumnFilter = (columnName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
    setCurrentPage(1);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handleSectionFilterChange = (value: string) => {
    setSectionFilter(value);
    setCurrentPage(1);
  };
  const handleSort = (columnName: string) => {
    if (sortBy === columnName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnName);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };
  const getSortIcon = (columnName: string) => {
    if (sortBy !== columnName) {
      return null;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map(row => row.id?.toString() || '');
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };
  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };
  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Oui' : 'Non'}</Badge>;
    }

    // Special formatting for sections/categories with vibrant random colors
    if (columnName === 'data_section' && value) {
      // Check if value contains multiple sections separated by comma
      if (value.includes(',')) {
        const sections = value.split(',').map((section: string) => section.trim()).filter(Boolean);
        return <div className="flex flex-wrap gap-1">
            {sections.map((section: string, index: number) => {
            const colorClass = generateSectionColor(section);
            return <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
                  {section}
                </span>;
          })}
          </div>;
      } else {
        const colorClass = generateSectionColor(value);
        return <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
            {value}
          </span>;
      }
    }
    if (columnName.includes('date') || columnName.includes('_at')) {
      try {
        const date = new Date(value);
        return <span className="text-sm text-muted-foreground">{date.toLocaleString('fr-FR')}</span>;
      } catch {
        return <span className="text-sm">{value}</span>;
      }
    }
    if (typeof value === 'string' && value.length > 40) {
      return <span title={value} className="text-sm">
          {value.substring(0, 40)}...
        </span>;
    }
    return <span className="text-sm">{value}</span>;
  };
  const tableTitle = tableName === 'apollo_contacts' ? 'Contacts Apollo' : 'Contacts CRM';
  return <div className="h-screen flex flex-col p-6">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tableTitle}</h1>
            <p className="text-muted-foreground">
              {totalCount.toLocaleString('fr-FR')} enregistrement(s) au total
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={e => handleSearch(e.target.value)} className="pl-8" />
          </div>
          {tableName === 'crm_contacts' && sections.length > 0 && <TooltipProvider>
              <div className="flex items-center space-x-2">
                {sections.map(section => {
              const isSelected = selectedSections.includes(section.value);
              return <Tooltip key={section.value}>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 border ${isSelected ? generateSectionColor(section.value) : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`} onClick={() => toggleSection(section.value)}>
                          {section.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isSelected ? `Filtrer par ${section.value} (cliquer pour désactiver)` : `Filtrer par ${section.value} (cliquer pour activer)`}</p>
                      </TooltipContent>
                    </Tooltip>;
            })}
              </div>
            </TooltipProvider>}
          <Button variant="outline" onClick={openColumnDialog}>
            <Settings className="h-4 w-4 mr-2" />
            Colonnes
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm flex-1 flex flex-col min-h-0 mt-6">
        {loading ? <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des données...</span>
          </div> : <div className="flex-1 flex flex-col min-h-0">
            {/* Table Header with selection controls */}
            {selectedRows.size > 0 && <div className="px-6 py-4 bg-primary/5 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {selectedRows.size} élément(s) sélectionné(s)
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter sélection
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>}

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Table with horizontal scroll */}
              <div className="flex-1 overflow-auto" ref={tableContainerRef}>
                <table className="w-full min-w-max">
                  {/* Fixed Header */}
                  <thead className="sticky top-0 bg-table-header border-b border-table-border z-20">
                    <tr>
                      <th className="w-12 px-4 py-4 text-left sticky top-0 left-0 bg-blue-50/95 backdrop-blur-sm border-r border-blue-200/30 z-30">
                        <Checkbox checked={selectedRows.size === data.length && data.length > 0} onCheckedChange={handleSelectAll} aria-label="Sélectionner tout" />
                      </th>
                      {displayColumns.map(column => {
                        const isPinned = pinnedColumns.has(column.name);
                        const isDropdownOpen = openColumnDropdown === column.name;
                        // Since only one column can be pinned, it's always at position 48px (after checkbox)
                        const borderStyle = isScrolled && isPinned ? 'border-r-4 border-primary/30 shadow-lg' : isPinned ? 'border-r-2 border-primary/20 shadow-md' : '';
                        return (
                           <th 
                             key={column.name} 
                             className={`
                               px-4 py-4 text-left min-w-[120px]
                               sticky top-0 
                               ${isPinned ? 'left-0 z-30 bg-blue-50/95 backdrop-blur-sm border-r border-blue-200/30 font-semibold text-primary' : 'z-20 bg-table-header font-semibold text-muted-foreground'}
                             `}
                             style={isPinned ? { left: '48px' } : {}}
                          >
                            <div className="flex items-center justify-between space-x-1">
                              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort(column.name)}>
                                <span className="uppercase text-xs tracking-wider">{translateColumnName(column.name)}</span>
                                {getSortIcon(column.name)}
                              </div>
                              <DropdownMenu open={isDropdownOpen} onOpenChange={(open) => setOpenColumnDropdown(open ? column.name : null)}>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 hover:bg-muted/80"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="w-56 bg-background border shadow-lg z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuLabel className="text-xs font-medium">{translateColumnName(column.name)}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Recherche dans la colonne */}
                                  <div className="p-2">
                                    <Input
                                      placeholder={`Filtrer ${translateColumnName(column.name)}...`}
                                      value={columnFilters[column.name] || ''}
                                      onChange={(e) => handleColumnFilter(column.name, e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                    {columnFilters[column.name] && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1 h-6 w-full text-xs"
                                        onClick={() => clearColumnFilter(column.name)}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Effacer
                                      </Button>
                                    )}
                                  </div>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Tri */}
                                  <DropdownMenuCheckboxItem
                                    checked={sortBy === column.name && sortOrder === 'asc'}
                                    onCheckedChange={() => {
                                      setSortBy(column.name);
                                      setSortOrder('asc');
                                      setCurrentPage(1);
                                    }}
                                  >
                                    <ArrowUp className="h-3 w-3 mr-2" />
                                    Trier croissant
                                  </DropdownMenuCheckboxItem>
                                  
                                  <DropdownMenuCheckboxItem
                                    checked={sortBy === column.name && sortOrder === 'desc'}
                                    onCheckedChange={() => {
                                      setSortBy(column.name);
                                      setSortOrder('desc');
                                      setCurrentPage(1);
                                    }}
                                  >
                                    <ArrowDown className="h-3 w-3 mr-2" />
                                    Trier décroissant
                                  </DropdownMenuCheckboxItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {/* Épingler */}
                                  <DropdownMenuCheckboxItem
                                    checked={pinnedColumns.has(column.name)}
                                    onCheckedChange={() => toggleColumnPin(column.name)}
                                  >
                                    {isPinned ? '📌 Désépingler' : '📍 Épingler à gauche'}
                                  </DropdownMenuCheckboxItem>
                                  
                                  {/* Masquer la colonne (sauf id et email) */}
                                  {column.name !== 'id' && column.name !== 'email' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem
                                        checked={false}
                                        onCheckedChange={() => toggleColumnVisibility(column.name)}
                                      >
                                        👁️‍🗨️ Masquer la colonne
                                      </DropdownMenuCheckboxItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>
                        );
                      })}
                      <th className="w-20 px-4 py-4 text-center sticky top-0 bg-table-header z-20">
                        <span className="uppercase text-xs tracking-wider font-semibold text-muted-foreground">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Scrollable Body */}
                  <tbody>
                    {data.map((row, index) => {
                  const rowId = row.id?.toString() || index.toString();
                  const isSelected = selectedRows.has(rowId);
                  return <tr key={rowId} className={`border-b border-table-border hover:bg-table-row-hover transition-colors ${isSelected ? 'bg-table-selected' : ''}`}>
                          <td className="w-12 px-4 py-4 sticky left-0 bg-blue-50/95 backdrop-blur-sm border-r border-blue-200/30 z-10">
                            <Checkbox checked={isSelected} onCheckedChange={checked => handleSelectRow(rowId, !!checked)} aria-label={`Sélectionner ligne ${index + 1}`} />
                          </td>
                          {displayColumns.map(column => {
                            const isPinned = pinnedColumns.has(column.name);
                            // Since only one column can be pinned, it's always at position 48px (after checkbox)
                            const borderStyle = isScrolled && isPinned ? 'border-r-4 border-primary/30 shadow-lg' : isPinned ? 'border-r-2 border-primary/20 shadow-md' : '';
                            return (
                               <td 
                                 key={column.name} 
                                 className={`px-4 py-4 min-w-[120px] ${isPinned ? 'sticky bg-blue-50/95 backdrop-blur-sm border-r border-blue-200/30 z-10 font-semibold text-primary' : ''}`}
                                 style={isPinned ? { left: '48px' } : {}}
                              >
                                {formatCellValue(row[column.name], column.name)}
                              </td>
                            );
                          })}
                          <td className="w-20 px-4 py-4">
                            <div className="flex items-center justify-center space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>;
                })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="border-t border-table-border bg-muted/20 px-[25px] py-[10px] flex-shrink-0">
              <DataPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalCount} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
            </div>
          </div>}
      </div>

      {/* Dialog de gestion des colonnes */}
      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent className="max-w-5xl w-[90vw] h-[80vh] bg-background flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Gestion des colonnes</DialogTitle>
            <DialogDescription>
              Sélectionnez les colonnes à afficher dans le tableau. Déplacez les colonnes entre les sections pour les afficher ou les masquer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Colonnes affichées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-green-600 flex-shrink-0">Colonnes affichées ({Array.from(tempVisibleColumns).length})</h3>
              <div className="border rounded-lg p-3 bg-green-50/50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {tempColumnOrder
                    .filter(colName => tempVisibleColumns.has(colName))
                    .map((colName, index) => {
                      const column = allColumns.find(col => col.name === colName);
                      if (!column) return null;
                      return (
                        <div key={column.name} className="flex items-center gap-2 p-2 bg-background rounded border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveColumnUp(column.name)}
                              disabled={index === 0}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              title="Monter"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveColumnDown(column.name)}
                              disabled={index === tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length - 1}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              title="Descendre"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-medium flex-1">{translateColumnName(column.name)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleColumnVisibility(column.name)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            title="Masquer"
                          >
                            <ArrowRight className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      );
                    })}
                  {tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Aucune colonne affichée
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonnes non affichées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-gray-600 flex-shrink-0">Colonnes masquées ({allColumns.filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name)).length})</h3>
              <div className="border rounded-lg p-3 bg-gray-50/50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {allColumns
                    .filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name))
                    .map(column => (
                      <div key={column.name} className="flex items-center justify-between p-2 bg-background rounded border border-gray-200 hover:border-gray-300 transition-colors">
                        <span className="text-sm flex-1 mr-2">{translateColumnName(column.name)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleColumnVisibility(column.name)}
                          className="h-8 w-8 p-0 hover:bg-green-100"
                        >
                          <ArrowLeftRight className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    ))}
                  {allColumns.filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name)).length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Toutes les colonnes sont affichées
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 flex-shrink-0 border-t">
            <Button variant="outline" onClick={cancelColumnChanges}>
              Annuler
            </Button>
            <Button onClick={applyColumnChanges}>
              Afficher ({Array.from(tempVisibleColumns).length} colonnes)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TableView;