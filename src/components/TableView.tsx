import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import moment from 'moment';
import 'moment/locale/fr'; // Import French locale
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AssignLeadsDialog } from '@/components/AssignLeadsDialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Download, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ExternalLink, MoreHorizontal, X, ChevronDown, Settings, ArrowRight, ArrowLeftRight, GripVertical, Check, X as XIcon, Columns, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import DataPagination from './DataPagination';
import TableFilters, { FilterValues } from './TableFilters';
import { useTableData } from '@/hooks/useTableData';
import { useTableSections } from '@/hooks/useTableSections';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ExportDialog, { ExportOptions } from './ExportDialog';
import * as XLSX from 'xlsx';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [columnSearchTerm, setColumnSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Initialize sorting state from URL parameters or default values
  const urlParams = new URLSearchParams(location.search);
  const [sortBy, setSortBy] = useState(urlParams.get('sortBy') || 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(urlParams.get('sortOrder') as 'asc' | 'desc' || 'desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set(['email']));
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openColumnDropdown, setOpenColumnDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<Set<string>>(new Set());
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]);
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnName: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>(''); // Nouvelle variable pour stocker la valeur originale
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState<any[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set()); // Track pending updates to ignore realtime
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  // Email warning dialog state
  const [emailWarningOpen, setEmailWarningOpen] = useState(false);
  const [pendingEmailEdit, setPendingEmailEdit] = useState<{
    rowId: string;
    columnName: string;
    value: string;
  } | null>(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{id: string, email: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Assign leads dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Selection scope state
  const [selectAllData, setSelectAllData] = useState(false);

  // Search columns suggestion state
  const [searchColumnsOpen, setSearchColumnsOpen] = useState(false);
  const [selectedSearchColumns, setSelectedSearchColumns] = useState<string[]>(['email', 'first_name', 'last_name', 'company']); // Default columns

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Memoize visible columns array to prevent infinite re-renders
  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);

  // Fetch data using server-side pagination
  const {
    data,
    totalCount,
    totalPages,
    loading,
    refetch
  } = useTableData({
    tableName,
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    searchColumns: selectedSearchColumns, // Pass selected search columns
    sectionFilter: selectedSections.length > 0 ? selectedSections.join(',') : 'all',
    sortBy,
    sortOrder,
    visibleColumns: visibleColumnsArray,
    advancedFilters
  });

  // Update local data when server data changes
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  // Real-time updates setup
  useEffect(() => {
    const channel = supabase.channel('table-changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: tableName
    }, payload => {
      // Update local data with real-time changes from other users
      const updatedRecord = payload.new;
      if (updatedRecord) {
        const updateKey = `${updatedRecord.id}`;

        // If we have a pending update for this record, ignore this realtime update to avoid conflicts
        if (pendingUpdates.has(updateKey)) {
          console.log('Ignoring realtime update for pending record:', updateKey);
          return;
        }
        setLocalData(prev => prev.map(row => row.id === updatedRecord.id ? {
          ...row,
          ...updatedRecord
        } : row));
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

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
    let newSelectedSections: string[];
    if (selectedSections.includes(sectionValue)) {
      newSelectedSections = selectedSections.filter(s => s !== sectionValue);
    } else {
      newSelectedSections = [...selectedSections, sectionValue];
    }
    
    setSelectedSections(newSelectedSections);
    
    // Synchroniser avec les filtres avancés
    const newAdvancedFilters = { ...advancedFilters };
    if (newSelectedSections.length === 0) {
      delete newAdvancedFilters.dataSection;
    } else if (newSelectedSections.length === 1) {
      newAdvancedFilters.dataSection = newSelectedSections[0];
    } else {
      // Si plusieurs sections sont sélectionnées, utiliser la première
      newAdvancedFilters.dataSection = newSelectedSections[0];
    }
    
    setAdvancedFilters(newAdvancedFilters);
    setCurrentPage(1);
  };
  const removeSection = (sectionValue: string) => {
    const newSelectedSections = selectedSections.filter(s => s !== sectionValue);
    setSelectedSections(newSelectedSections);
    
    // Synchroniser avec les filtres avancés
    const newAdvancedFilters = { ...advancedFilters };
    if (newSelectedSections.length === 0) {
      delete newAdvancedFilters.dataSection;
    } else {
      newAdvancedFilters.dataSection = newSelectedSections[0];
    }
    
    setAdvancedFilters(newAdvancedFilters);
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
        name: 'brevo_status',
        type: 'string',
        nullable: true
      }, {
        name: 'hubspot_status',
        type: 'string',
        nullable: true
      }, {
        name: 'systemeio_status',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_last_email',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_last_opened',
        type: 'string',
        nullable: true
      }, {
        name: 'brevo_last_clicked',
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
    // Default columns based on user requirements: email, data_section, name, phone, company
    let defaultColumns: string[] = [];
    if (tableName === 'crm_contacts') {
      defaultColumns = ['email', 'data_section', 'name', 'tel_pro', 'company'];
    } else if (tableName === 'apollo_contacts') {
      defaultColumns = ['email', 'data_section', 'last_name', 'work_direct_phone', 'company'];
    }
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
  const regularDisplayColumns = allColumns.filter(col => !pinnedColumns.has(col.name) && orderedVisibleColumns.includes(col.name)).sort((a, b) => orderedVisibleColumns.indexOf(a.name) - orderedVisibleColumns.indexOf(b.name));
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
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(tempColumnOrder.filter(col => tempVisibleColumns.has(col)));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order with all columns (visible and hidden)
    const newOrder = [...items,
    // reordered visible columns
    ...tempColumnOrder.filter(col => !tempVisibleColumns.has(col)) // hidden columns at the end
    ];
    setTempColumnOrder(newOrder);
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

  // Inline editing functions
  const startEditing = (rowId: string, columnName: string, currentValue: any) => {
    // Don't edit readonly columns
    if (columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at') {
      return;
    }
    const valueStr = currentValue?.toString() || '';
    setEditingCell({
      rowId,
      columnName
    });
    setEditingValue(valueStr);
    setOriginalValue(valueStr); // Stocker la valeur originale au moment de l'édition
  };
  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
    setOriginalValue(''); // Reset la valeur originale
  };
  const saveEdit = async () => {
    if (!editingCell) return;
    const {
      rowId,
      columnName
    } = editingCell;

    // Vérifier si la valeur a vraiment changé en comparant avec la valeur originale
    if (editingValue === originalValue) {
      // Aucun changement, annuler l'édition sans faire de requête
      cancelEditing();
      return;
    }

    // Vérifier si c'est une modification d'email
    const isEmailField = columnName === 'email' || columnName.toLowerCase().includes('email');
    if (isEmailField) {
      // Stocker les détails de l'édition en attente
      setPendingEmailEdit({
        rowId,
        columnName,
        value: editingValue
      });
      setEmailWarningOpen(true);
      return;
    }

    // Continuer avec la sauvegarde normale
    await proceedWithSave(rowId, columnName, editingValue);
  };
  const proceedWithSave = async (rowId: string, columnName: string, value: string) => {
    // Convert value based on column type
    let processedValue: any = value;
    const column = allColumns.find(col => col.name === columnName);
    if (column?.type === 'number') {
      processedValue = value === '' ? null : Number(value);
      if (isNaN(processedValue)) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Valeur numérique invalide.",
          duration: 4000 // 4 secondes pour les erreurs
        });
        return;
      }
    } else if (column?.type === 'boolean') {
      processedValue = value.toLowerCase() === 'true' || value === '1';
    }

    // Optimistic update - update local data immediately
    const optimisticData = localData.map(row => row.id === rowId ? {
      ...row,
      [columnName]: processedValue
    } : row);
    setLocalData(optimisticData);

    // Mark this record as having a pending update to ignore realtime conflicts
    const updateKey = `${rowId}`;
    setPendingUpdates(prev => new Set([...prev, updateKey]));

    // Clear editing state immediately for fluid UX
    cancelEditing();
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from(tableName).update({
        [columnName]: processedValue
      }).eq('id', rowId);
      if (error) throw error;

      // Récupérer la ligne mise à jour depuis la base pour s'assurer d'avoir les vraies données
      const {
        data: updatedRow,
        error: fetchError
      } = await supabase.from(tableName).select('*').eq('id', rowId).single();
      if (fetchError) throw fetchError;

      // Mettre à jour seulement cette ligne dans localData
      if (updatedRow) {
        setLocalData(prev => prev.map(row => row.id === rowId ? {
          ...row,
          ...updatedRow
        } : row));
      }
      toast({
        title: "Modification sauvegardée",
        description: `${translateColumnName(columnName)} mis à jour avec succès.`,
        duration: 2500 // 2.5 secondes pour les succès
      });

      // Add visual feedback for successful update
      const cellKey = `${rowId}-${columnName}`;
      setRecentlyUpdated(prev => new Set([...prev, cellKey]));

      // Remove visual feedback after 2 seconds
      setTimeout(() => {
        setRecentlyUpdated(prev => {
          const updated = new Set(prev);
          updated.delete(cellKey);
          return updated;
        });
      }, 2000);
    } catch (error) {
      console.error('Error saving edit:', error);

      // Revert optimistic update on error - fetch fresh data
      const {
        data: freshData,
        error: fetchError
      } = await supabase.from(tableName).select('*').eq('id', rowId).single();
      if (!fetchError && freshData) {
        setLocalData(prev => prev.map(row => row.id === rowId ? {
          ...row,
          ...freshData
        } : row));
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la modification.",
        duration: 4000 // 4 secondes pour les erreurs
      });
    } finally {
      setIsSaving(false);
      // Clear pending update flag after a delay to allow realtime to arrive
      setTimeout(() => {
        setPendingUpdates(prev => {
          const updated = new Set(prev);
          updated.delete(updateKey);
          return updated;
        });
      }, 1000);
    }
  };
  const handleEmailWarningConfirm = async () => {
    if (pendingEmailEdit) {
      setEmailWarningOpen(false);

      // Utiliser proceedWithSave qui gère déjà la mise à jour optimiste et le real-time
      setEditingCell({
        rowId: pendingEmailEdit.rowId,
        columnName: pendingEmailEdit.columnName
      });
      setEditingValue(pendingEmailEdit.value);
      await proceedWithSave(pendingEmailEdit.rowId, pendingEmailEdit.columnName, pendingEmailEdit.value);
      setPendingEmailEdit(null);
    }
  };
  const handleExport = async (options: ExportOptions) => {
    try {
      const exportParams = {
        tableName,
        page: options.scope === 'current' ? currentPage : 1,
        pageSize: options.scope === 'current' ? pageSize : totalCount,
        searchTerm: debouncedSearchTerm,
        sectionFilter: selectedSections.length > 0 ? selectedSections.join(',') : 'all',
        sortBy,
        sortOrder,
        visibleColumns: [],
        // Récupérer toutes les colonnes pour l'export
        advancedFilters
      };
      const {
        data: exportData,
        error
      } = await supabase.functions.invoke('table-data', {
        body: exportParams
      });
      if (error) throw error;
      const contacts = exportData.data || [];
      if (contacts.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucun contact à exporter avec les filtres appliqués",
          variant: "destructive",
          duration: 4000 // 4 secondes pour les erreurs
        });
        return;
      }

      // Créer le workbook Excel
      const workbook = XLSX.utils.book_new();

      // Préparer les données avec toutes les colonnes de la base de données
      const allKeys = Object.keys(contacts[0]); // Toutes les colonnes disponibles
      const headers = allKeys.map(key => translateColumnName(key));
      const exportRows = contacts.map(contact => allKeys.map(key => {
        const value = contact[key];
        // Formater les valeurs pour Excel
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object' && value instanceof Date) {
          // Configuration locale française pour moment.js
          moment.locale('fr');
          
          const now = moment();
          const dateValue = moment(value);
          const daysDiff = now.diff(dateValue, 'days');
          
          // Si plus d'une semaine (7 jours), afficher la date formatée
          if (daysDiff > 7) {
            return dateValue.format('D MMM YYYY');
          } else {
            // Sinon, afficher la notation relative
            return dateValue.fromNow();
          }
        }
        return String(value);
      }));

      // Ajouter les en-têtes
      const worksheetData = [headers, ...exportRows];

      // Créer la feuille
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Styliser les en-têtes (couleur de fond)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({
          r: 0,
          c: col
        });
        if (!worksheet[cellRef]) continue;
        worksheet[cellRef].s = {
          fill: {
            fgColor: {
              rgb: "3B82F6"
            }
          },
          font: {
            color: {
              rgb: "FFFFFF"
            },
            bold: true
          },
          alignment: {
            horizontal: "center"
          }
        };
      }

      // Ajuster les largeurs de colonnes
      const colWidths = headers.map(() => ({
        wch: 20
      }));
      worksheet['!cols'] = colWidths;

      // Ajouter la feuille au workbook
      const sheetName = tableName === 'apollo_contacts' ? 'Contacts Apollo' : 'Contacts CRM';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Générer et télécharger le fichier
      const fileName = `${options.filename}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast({
        title: "Export réussi",
        description: `${contacts.length} contacts exportés dans ${fileName}`,
        duration: 3000 // 3 secondes pour les succès importants
      });
      if (options.includeGoogleSheets) {
        toast({
          title: "Google Sheets",
          description: "La synchronisation Google Sheets sera disponible prochainement",
          duration: 3000 // 3 secondes pour les informations
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
        duration: 4000 // 4 secondes pour les erreurs
      });
    }
  };
  const handleEmailWarningCancel = () => {
    if (pendingEmailEdit) {
      // Remettre la valeur originale
      const originalValue = localData.find(row => row.id === pendingEmailEdit.rowId)?.[pendingEmailEdit.columnName] || '';
      setEditingValue(originalValue);
    }
    setEmailWarningOpen(false);
    setPendingEmailEdit(null);
  };

  // Delete functions
  const handleDeleteClick = (contact: any) => {
    // Check permissions first
    if (!hasPermission('delete_prospects')) {
      toast({
        variant: "destructive",
        title: "Permission refusée",
        description: "Vous n'avez pas les droits pour supprimer des contacts.",
        duration: 4000 // 4 secondes pour les erreurs importantes
      });
      return;
    }

    // Prepare contact info for confirmation
    const contactName = tableName === 'apollo_contacts' 
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact sans nom'
      : `${contact.firstname || ''} ${contact.name || ''}`.trim() || 'Contact sans nom';
    
    setContactToDelete({
      id: contact.id,
      email: contact.email || 'Email non défini',
      name: contactName
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', contactToDelete.id);

      if (error) {
        throw error;
      }

      // Remove from local data immediately for better UX
      setLocalData(prev => prev.filter(row => row.id !== contactToDelete.id));
      
      // Refresh data to get updated total count and pagination
      refetch();

      toast({
        title: "Contact supprimé",
        description: `Le contact ${contactToDelete.name} (${contactToDelete.email}) a été supprimé avec succès.`,
        duration: 3000 // 3 secondes pour les actions importantes
      });

      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer le contact. Veuillez réessayer.",
        duration: 4000 // 4 secondes pour les erreurs
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);
  const handleColumnFilter = (columnName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
    setCurrentPage(1);
  };
  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = {
        ...prev
      };
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
  // Get text columns for search suggestions
  const getTextColumns = (): {name: string, label: string}[] => {
    return allColumns
      .filter(col => col.type === 'string' && col.name !== 'id') // Only text columns, exclude ID
      .map(col => ({
        name: col.name,
        label: translateColumnName(col.name)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const textColumns = getTextColumns();

  // Set default search columns based on table type
  useEffect(() => {
    if (tableName === 'apollo_contacts') {
      setSelectedSearchColumns(['email', 'first_name', 'last_name', 'company', 'title']);
    } else {
      setSelectedSearchColumns(['email', 'firstname', 'name', 'company']);
    }
  }, [tableName]);

  // Synchronisation initiale des filtres avec les badges de section
  useEffect(() => {
    if (advancedFilters.dataSection) {
      const sections = Array.isArray(advancedFilters.dataSection) 
        ? advancedFilters.dataSection 
        : [advancedFilters.dataSection];
      setSelectedSections(sections);
    } else if (!advancedFilters.dataSection && selectedSections.length > 0) {
      setSelectedSections([]);
    }
  }, [advancedFilters.dataSection]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handleAdvancedFiltersChange = (filters: FilterValues) => {
    setAdvancedFilters(filters);
    
    // Synchroniser avec les badges de section
    if (filters.dataSection) {
      const sections = Array.isArray(filters.dataSection) 
        ? filters.dataSection 
        : [filters.dataSection];
      setSelectedSections(sections);
    } else {
      setSelectedSections([]);
    }
    
    // Afficher automatiquement les colonnes correspondantes aux filtres actifs
    const newVisibleColumns = new Set(visibleColumns);
    
    // Mapping des filtres vers les colonnes correspondantes
    const filterColumnMapping: Record<string, string> = {
      'zohoStatus': 'zoho_status',
      'apolloStatus': 'apollo_status', 
      'contactActive': 'contact_active',
      'industrie': 'industrie',
      'company': 'company'
    };
    
    // Ajouter les colonnes des filtres actifs
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterColumnMapping[filterKey]) {
        newVisibleColumns.add(filterColumnMapping[filterKey]);
      }
    });
    
    setVisibleColumns(newVisibleColumns);
    setCurrentPage(1);
  };
  const handleResetFilters = () => {
    setAdvancedFilters({});
    setSelectedSections([]); // Réinitialiser aussi les badges de section
    setCurrentPage(1);
  };
  const handleSectionFilterChange = (value: string) => {
    setSectionFilter(value);
    setCurrentPage(1);
  };
  const handleSort = (columnName: string) => {
    let newSortBy = columnName;
    let newSortOrder: 'asc' | 'desc';
    if (sortBy === columnName) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      newSortOrder = 'asc';
    }
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);

    // Update URL parameters to persist sorting
    const params = new URLSearchParams(location.search);
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, {
      replace: true
    });
  };
  const getSortIcon = (columnName: string) => {
    if (sortBy !== columnName) {
      return null;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = localData.map(row => row.id?.toString() || '');
      setSelectedRows(new Set(allIds));
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
        // Configuration locale française pour moment.js
        moment.locale('fr');
        
        const now = moment();
        const dateValue = moment(value);
        const daysDiff = now.diff(dateValue, 'days');
        
        // Si plus d'une semaine (7 jours), afficher la date formatée
        if (daysDiff > 7) {
          return <span className="text-sm text-muted-foreground">{dateValue.format('D MMM YYYY')}</span>;
        } else {
          // Sinon, afficher la notation relative
          return <span className="text-sm text-muted-foreground">{dateValue.fromNow()}</span>;
        }
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
            <div className="flex items-center space-x-2">
              {/* Search input with column suggestions */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={`Rechercher dans ${selectedSearchColumns.length} colonne(s)...`} 
                  value={searchTerm} 
                  onChange={e => handleSearch(e.target.value)} 
                  className="pl-8 pr-10" 
                />
                {/* Column selector button */}
                <DropdownMenu open={searchColumnsOpen} onOpenChange={setSearchColumnsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Colonnes de recherche</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedSearchColumns.length} sélectionnée(s)
                      </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-60 overflow-y-auto">
                      {textColumns.map(column => (
                        <DropdownMenuCheckboxItem
                          key={column.name}
                          checked={selectedSearchColumns.includes(column.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSearchColumns(prev => [...prev, column.name]);
                            } else {
                              setSelectedSearchColumns(prev => prev.filter(col => col !== column.name));
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{column.label}</span>
                            <span className="text-xs text-muted-foreground">{column.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2 space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedSearchColumns(textColumns.map(col => col.name))}
                      >
                        Tout sélectionner
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          if (tableName === 'apollo_contacts') {
                            setSelectedSearchColumns(['email', 'first_name', 'last_name', 'company', 'title']);
                          } else {
                            setSelectedSearchColumns(['email', 'firstname', 'name', 'company']);
                          }
                        }}
                      >
                        Réinitialiser par défaut
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Bouton de rafraîchissement manuel */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => refetch && refetch()} disabled={loading} className="h-9 w-9 p-0">
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualiser les données</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </div>

      {/* All Controls - Above Table */}
      <div className="flex items-center justify-between gap-2 mt-5 -mb-0.5 ">
        {/* Section Filters - Left Side */}
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
        
        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="h-9 px-3 relative">
            <Settings className="h-4 w-4 mr-2" />
            Filtres
            {(() => {
              const activeFiltersCount = Object.values(advancedFilters).filter(value => 
                value !== undefined && value !== null && value !== '' && 
                (Array.isArray(value) ? value.length > 0 : true)
              ).length;
              return activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              );
            })()}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={openColumnDialog} className="h-9 px-3">
                  <Columns className="h-4 w-4 mr-2" />
                  Colonnes
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gérer l'affichage et l'ordre des colonnes du tableau</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exporter les données du tableau</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {filtersOpen && <div className="mt-3">
          <TableFilters tableName={tableName} filters={advancedFilters} onFiltersChange={handleAdvancedFiltersChange} onReset={handleResetFilters} isOpen={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} showOnlyButton={false} />
        </div>}

      <div className={`bg-card rounded-lg border border-border shadow-sm flex-1 flex flex-col min-h-0 mt-3 ${filtersOpen ? 'min-h-[600px]' : ''}`}>
        {loading ? <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des données...</span>
          </div> : <div className="flex-1 flex flex-col min-h-0">
            {/* Table Header with selection controls */}
            {selectedRows.size > 0 && <div className="px-6 py-4 bg-primary/5 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="select-all-data"
                        checked={selectAllData}
                        onCheckedChange={setSelectAllData}
                      />
                      <Label htmlFor="select-all-data" className="text-sm text-muted-foreground">
                        Sélectionner toutes les données {selectAllData ? `(${totalCount} au total)` : `(${pageSize} de cette page)`}
                      </Label>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {selectedRows.size} élément(s) sélectionné(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAssignDialogOpen(true)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assigner à un sales ({selectedRows.size})
                    </Button>
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
                        <Checkbox checked={selectedRows.size === localData.length && localData.length > 0} onCheckedChange={handleSelectAll} aria-label="Sélectionner tout" />
                      </th>
                      {displayColumns.map(column => {
                    const isPinned = pinnedColumns.has(column.name);
                    const isDropdownOpen = openColumnDropdown === column.name;
                    // Since only one column can be pinned, it's always at position 48px (after checkbox)
                    const borderStyle = isScrolled && isPinned ? 'border-r-4 border-primary/50 shadow-xl' : isPinned ? 'border-r-3 border-primary/40 shadow-lg' : '';
                    return <th key={column.name} className={`
                               px-4 py-4 text-left min-w-[120px]
                               sticky top-0 
                               ${isPinned ? `left-0 z-30 bg-primary/5 backdrop-blur-sm font-semibold text-primary ${borderStyle}` : 'z-20 bg-table-header font-semibold text-muted-foreground'}
                             `} style={isPinned ? {
                      left: '48px'
                    } : {}}>
                            <div className="flex items-center justify-between space-x-1">
                              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort(column.name)}>
                                <span className="uppercase text-xs tracking-wider">{translateColumnName(column.name)}</span>
                                {getSortIcon(column.name)}
                              </div>
                              <DropdownMenu open={isDropdownOpen} onOpenChange={open => setOpenColumnDropdown(open ? column.name : null)}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/80" onClick={e => e.stopPropagation()}>
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50" onClick={e => e.stopPropagation()}>
                                  <DropdownMenuLabel className="text-xs font-medium">{translateColumnName(column.name)}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Recherche dans la colonne */}
                                  <div className="p-2">
                                    <Input placeholder={`Filtrer ${translateColumnName(column.name)}...`} value={columnFilters[column.name] || ''} onChange={e => handleColumnFilter(column.name, e.target.value)} className="h-8 text-xs" />
                                    {columnFilters[column.name] && <Button variant="ghost" size="sm" className="mt-1 h-6 w-full text-xs" onClick={() => clearColumnFilter(column.name)}>
                                        <X className="h-3 w-3 mr-1" />
                                        Effacer
                                      </Button>}
                                  </div>
                                  <DropdownMenuSeparator />
                                  
                                  {/* Tri */}
                                   <DropdownMenuCheckboxItem checked={sortBy === column.name && sortOrder === 'asc'} onCheckedChange={() => {
                              setSortBy(column.name);
                              setSortOrder('asc');
                              setCurrentPage(1);
                              // Update URL parameters
                              const params = new URLSearchParams(location.search);
                              params.set('sortBy', column.name);
                              params.set('sortOrder', 'asc');
                              navigate({
                                pathname: location.pathname,
                                search: params.toString()
                              }, {
                                replace: true
                              });
                            }}>
                                    <ArrowUp className="h-3 w-3 mr-2" />
                                    Trier croissant
                                  </DropdownMenuCheckboxItem>
                                  
                                   <DropdownMenuCheckboxItem checked={sortBy === column.name && sortOrder === 'desc'} onCheckedChange={() => {
                              setSortBy(column.name);
                              setSortOrder('desc');
                              setCurrentPage(1);
                              // Update URL parameters
                              const params = new URLSearchParams(location.search);
                              params.set('sortBy', column.name);
                              params.set('sortOrder', 'desc');
                              navigate({
                                pathname: location.pathname,
                                search: params.toString()
                              }, {
                                replace: true
                              });
                            }}>
                                    <ArrowDown className="h-3 w-3 mr-2" />
                                    Trier décroissant
                                  </DropdownMenuCheckboxItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {/* Épingler */}
                                  <DropdownMenuCheckboxItem checked={pinnedColumns.has(column.name)} onCheckedChange={() => toggleColumnPin(column.name)}>
                                    {isPinned ? '📌 Désépingler' : '📍 Épingler à gauche'}
                                  </DropdownMenuCheckboxItem>
                                  
                                  {/* Masquer la colonne (sauf id et email) */}
                                  {column.name !== 'id' && column.name !== 'email' && <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => {
                                const newVisible = new Set(visibleColumns);
                                newVisible.delete(column.name);
                                setVisibleColumns(newVisible);
                              }}>
                                        👁️‍🗨️ Masquer la colonne
                                      </DropdownMenuCheckboxItem>
                                    </>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>;
                  })}
                      <th className="w-20 px-4 py-4 text-center sticky top-0 bg-table-header z-20">
                        <span className="uppercase text-xs tracking-wider font-semibold text-muted-foreground">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Scrollable Body */}
                  <tbody>
                    {localData.map((row, index) => {
                  const rowId = row.id?.toString() || index.toString();
                  const isSelected = selectedRows.has(rowId);
                  return <tr key={rowId} className={`border-b border-table-border hover:bg-table-row-hover transition-colors ${isSelected ? 'bg-table-selected' : ''}`}>
                          <td className="w-12 px-4 py-4 sticky left-0 bg-blue-50/95 backdrop-blur-sm border-r border-blue-200/30 z-10">
                            <Checkbox checked={isSelected} onCheckedChange={checked => handleSelectRow(rowId, !!checked)} aria-label={`Sélectionner ligne ${index + 1}`} />
                          </td>
                          {displayColumns.map(column => {
                      const isPinned = pinnedColumns.has(column.name);
                      // Since only one column can be pinned, it's always at position 48px (after checkbox)
                      const borderStyle = isScrolled && isPinned ? 'border-r-4 border-primary/50 shadow-xl' : isPinned ? 'border-r-3 border-primary/40 shadow-lg' : '';
                      const isEditing = editingCell?.rowId === rowId && editingCell?.columnName === column.name;
                      const canEdit = column.name !== 'id' && column.name !== 'created_at' && column.name !== 'updated_at';
                      const cellKey = `${rowId}-${column.name}`;
                      const wasRecentlyUpdated = recentlyUpdated.has(cellKey);
                      return <td key={column.name} className={`px-4 py-4 min-w-[120px] ${isPinned ? `sticky bg-primary/5 backdrop-blur-sm z-10 font-semibold text-primary ${borderStyle}` : ''} ${canEdit ? 'cursor-pointer hover:bg-muted/30' : ''} ${wasRecentlyUpdated ? 'bg-green-50 border-green-200 transition-all duration-1000' : ''}`} style={isPinned ? {
                        left: '48px'
                      } : {}} onDoubleClick={() => canEdit && startEditing(rowId, column.name, row[column.name])}>
                                  {isEditing ? <div className="flex items-center gap-2">
                                      {column.name === 'data_section' ? <Select value={editingValue} onValueChange={value => setEditingValue(value)} onOpenChange={open => {
                            if (!open) {
                              saveEdit();
                            }
                          }}>
                                          <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Arlynk">Arlynk</SelectItem>
                                            <SelectItem value="Aicademia">Aicademia</SelectItem>
                                          </SelectContent>
                                        </Select> : <Input ref={editInputRef} value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await saveEdit();
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }} onBlur={saveEdit} className="h-8 text-sm" disabled={isSaving} />}
                                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    </div> : <div className="flex items-center justify-between group">
                                     <span>{formatCellValue(row[column.name], column.name)}</span>
                                     {canEdit && <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity ml-2" />}
                                   </div>}
                               </td>;
                    })}
                          <td className="w-20 px-4 py-4">
                            <div className="flex items-center justify-center space-x-1">
                              
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={() => {
                          // Preserve current sort parameters when navigating to details
                          const currentParams = new URLSearchParams(location.search);
                          navigate(`/contact/${tableName}/${rowId}?${currentParams.toString()}`);
                        }}>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(row)} disabled={!hasPermission('delete_prospects')}>
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
              Glissez et déposez les colonnes pour réorganiser leur ordre d'affichage. Déplacez les colonnes entre les sections pour les afficher ou les masquer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Colonnes affichées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-green-600 flex-shrink-0">Colonnes affichées ({tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length})</h3>
              <div className="border rounded-lg p-3 bg-green-50/50 flex-1 overflow-y-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="visible-columns">
                    {(provided, snapshot) => <div {...provided.droppableProps} ref={provided.innerRef} className={`space-y-2 min-h-[100px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-green-100/70 rounded-lg' : ''}`}>
                        {tempColumnOrder.filter(colName => tempVisibleColumns.has(colName)).map((colName, index) => {
                      const column = allColumns.find(col => col.name === colName);
                      if (!column) return null;
                      return <Draggable key={column.name} draggableId={column.name} index={index}>
                                {(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-2 p-2 bg-background rounded border border-green-200 hover:border-green-300 transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-1 bg-green-50 z-50' : 'hover:shadow-md'}`} style={{
                          ...provided.draggableProps.style,
                          transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(1deg)` : provided.draggableProps.style?.transform
                        }}>
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors duration-150" title="Glisser pour réorganiser">
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium flex-1">{translateColumnName(column.name)}</span>
                                    <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibility(column.name)} className="h-8 w-8 p-0 hover:bg-red-100 transition-colors duration-200" title="Masquer">
                                      <ArrowRight className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>}
                              </Draggable>;
                    })}
                        {provided.placeholder}
                        {tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length === 0 && <div className="text-center text-muted-foreground text-sm py-8">
                            Aucune colonne affichée
                          </div>}
                      </div>}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>

            {/* Colonnes non affichées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-gray-600 flex-shrink-0">Colonnes masquées ({allColumns.filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name)).length})</h3>
              <div className="border rounded-lg p-3 bg-gray-50/50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {allColumns.filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name)).map(column => <div key={column.name} className="flex items-center justify-between p-2 bg-background rounded border border-gray-200 hover:border-gray-300 transition-colors duration-200 hover:shadow-sm">
                        <span className="text-sm flex-1 mr-2">{translateColumnName(column.name)}</span>
                        <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibility(column.name)} className="h-8 w-8 p-0 hover:bg-green-100 transition-colors duration-200" title="Afficher">
                          <ArrowLeftRight className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>)}
                  {allColumns.filter(col => col.name !== 'email' && col.name !== 'id' && !tempVisibleColumns.has(col.name)).length === 0 && <div className="text-center text-muted-foreground text-sm py-8">
                      Toutes les colonnes sont affichées
                    </div>}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 flex-shrink-0 border-t">
            <Button variant="outline" onClick={cancelColumnChanges}>
              Annuler
            </Button>
            <Button onClick={applyColumnChanges}>
              Afficher ({tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length} colonnes)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email warning dialog */}
      <AlertDialog open={emailWarningOpen} onOpenChange={setEmailWarningOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Modification d'email
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>Vous êtes sur le point de modifier une adresse email.</p>
              <p className="font-medium">Cette modification peut affecter :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Les campagnes email en cours</li>
                <li>L'historique des communications</li>
                <li>La délivrabilité des futures campagnes</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleEmailWarningCancel}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailWarningConfirm} className="bg-orange-600 hover:bg-orange-700">
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>Vous êtes sur le point de supprimer définitivement ce contact :</strong>
              </p>
              {contactToDelete && (
                <div className="bg-muted p-3 rounded-lg border-l-4 border-destructive">
                  <p><strong>Nom :</strong> {contactToDelete.name}</p>
                  <p><strong>Email :</strong> {contactToDelete.email}</p>
                  <p><strong>ID :</strong> {contactToDelete.id}</p>
                </div>
              )}
              <p className="text-destructive font-medium">
                ⚠️ Cette action est <u>irréversible</u>. Toutes les données liées à ce contact seront perdues définitivement.
              </p>
              <p>
                Êtes-vous absolument certain(e) de vouloir continuer ?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} tableName={tableName} totalCount={totalCount} currentPageCount={localData.length} appliedFilters={{
      searchTerm: debouncedSearchTerm,
      sectionFilter: sectionFilter !== 'all' ? sectionFilter : undefined,
      ...advancedFilters
    }} onExport={handleExport} />

      {/* Assign Leads Dialog */}
      <AssignLeadsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedRows={Array.from(selectedRows)}
        tableName={tableName}
        onAssignmentComplete={() => {
          setSelectedRows(new Set());
          // Refresh data if needed
        }}
      />
    </div>;
};
export default TableView;