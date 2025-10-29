import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import moment from 'moment';
import 'moment/locale/fr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Download, Loader2, Eye, Trash2, X, ChevronDown, Columns, UserPlus, ExternalLink, GripVertical, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataPagination from '@/components/DataPagination';
import TableFilters, { FilterValues } from '@/components/TableFilters';
import SalesProspectsFilters, { SalesProspectsFilterValues } from '@/components/SalesProspectsFilters';
import TableColumnHeader from '@/components/TableColumnHeader';
import { useAssignedProspectsData } from '@/hooks/useAssignedProspectsData';
import { createProspectUrl } from '@/lib/emailCrypto';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ExportDialog, { ExportOptions } from '@/components/ExportDialog';
import * as XLSX from 'xlsx';
interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}
const translateColumnName = (columnName: string): string => {
  const translations: Record<string, string> = {
    'id': 'ID',
    'email': 'Email',
    'created_at': 'Date de création',
    'updated_at': 'Date de mise à jour',
    'assigned_at': 'Date d\'assignation',
    'callback_date': 'Date de rappel',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'company': 'Entreprise',
    'title': 'Titre',
    'seniority': 'Ancienneté',
    'departments': 'Départements',
    'stage': 'Étape',
    'industry': 'Industrie',
    'nb_employees': 'Nombre d\'employés',
    'apollo_status': 'Statut Apollo',
    'zoho_status': 'Statut Zoho',
    'mobile_phone': 'Téléphone portable',
    'work_direct_phone': 'Téléphone professionnel',
    'person_linkedin_url': 'LinkedIn',
    'website': 'Site web',
    'last_contacted': 'Dernier contact',
    'data_section': 'Section',
    'source_table': 'Source',
    'data_source': 'Source de données',
    'actions': 'Actions',
    'boucle': 'Statut',
    'completed_at': 'Date de finalisation',
    'notes_sales': 'Notes du commercial',
    'statut_prospect': 'Statut prospect',
    'date_action': 'Date d\'action',
    'sdr_email': 'Email du SDR'
  };
  return translations[columnName] || columnName;
};
interface MySalesLeadsProps {
  filterMode?: 'assigned' | 'traites' | 'rappeler';
}
const MySalesLeads: React.FC<MySalesLeadsProps> = ({
  filterMode = 'assigned'
}) => {
  const {
    user,
    userRole
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('assigned_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(
      filterMode === 'traites' 
        ? (userRole === 'sales' || userRole === 'marketing' || userRole === 'admin')
          ? ['email', 'company', 'last_name', 'first_name', 'assigned_at', 'completed_at', 'notes_sales', 'statut_prospect', 'date_action', 'sdr_email', 'actions']
          : ['email', 'company', 'last_name', 'first_name', 'assigned_at', 'completed_at', 'notes_sales', 'statut_prospect', 'date_action', 'actions']
        : filterMode === 'rappeler'
        ? (userRole === 'sales' || userRole === 'marketing' || userRole === 'admin')
          ? ['email', 'callback_date', 'notes_sales', 'statut_prospect', 'date_action', 'sdr_email', 'actions']
          : ['email', 'callback_date', 'notes_sales', 'statut_prospect', 'date_action', 'actions']
        : ['email', 'company', 'last_name', 'first_name', 'assigned_at', 'actions']
    )
  );
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({});
  const [salesFilters, setSalesFilters] = useState<SalesProspectsFilterValues>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // États pour le dialog de colonnes
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<Set<string>>(new Set());
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]);

  // Configuration des colonnes personnalisées
  const [customColumns, setCustomColumns] = useState<any[]>([]);
  const [columnConfigLoaded, setColumnConfigLoaded] = useState(false);

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Memoize visible columns array
  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);

  // Colonnes épinglées fixes qui ne peuvent pas être cachées
  const pinnedColumns = new Set(['email', 'actions']);

  // Charger la configuration des colonnes au montage ou quand le filterMode change
  useEffect(() => {
    if (user) {
      setColumnConfigLoaded(false);
      loadTableConfig();
    }
  }, [user, filterMode]);

  // Initialiser les états temporaires du dialog
  useEffect(() => {
    if (visibleColumns.size > 0) {
      setTempVisibleColumns(new Set(visibleColumns));
      setTempColumnOrder(Array.from(visibleColumns));
    }
  }, [visibleColumns]);

  // Effet pour afficher automatiquement les colonnes quand un filtre est appliqué
  useEffect(() => {
    if (Object.keys(advancedFilters).length > 0) {
      const newVisibleColumns = new Set(visibleColumns);
      let hasChanges = false;

      // Mapper les filtres avancés vers les noms de colonnes correspondants
      const filterColumnMapping: Record<string, string> = {
        'dataSection': 'data_section',
        'zohoStatus': 'zoho_status',
        'apolloStatus': 'apollo_status',
        'industrie': 'industry',
        'company': 'company',
        'seniority': 'seniority',
        'stage': 'stage',
        'nbEmployees': 'nb_employees',
        'departments': 'departments',
        'contactOwner': 'contact_owner',
        'lists': 'lists',
        'emailStatus': 'email_status'
      };

      // Vérifier chaque filtre actif et ajouter la colonne correspondante
      Object.entries(advancedFilters).forEach(([filterKey, filterValue]) => {
        if (filterValue && filterColumnMapping[filterKey]) {
          const columnName = filterColumnMapping[filterKey];
          if (!newVisibleColumns.has(columnName)) {
            newVisibleColumns.add(columnName);
            hasChanges = true;
          }
        }
      });

      // Mettre à jour les colonnes visibles si des changements ont été faits
      if (hasChanges) {
        setVisibleColumns(newVisibleColumns);
      }
    }
  }, [advancedFilters, visibleColumns]);
  const loadTableConfig = async () => {
    if (!user) return;
    try {
      const tableName = `assigned_prospects_${filterMode}`;
      const {
        data,
        error
      } = await supabase.from('sales_table_config').select('column_config, table_settings').eq('sales_user_id', user.id).eq('table_name', tableName).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.column_config) {
        const config = Array.isArray(data.column_config) ? data.column_config : [];
        setCustomColumns(config);
        if (config.length > 0) {
          const visibleCols = config.filter((col: any) => col.visible !== false).map((col: any) => col.name);
          // S'assurer que les colonnes épinglées sont toujours incluses
          pinnedColumns.forEach(pinnedCol => {
            if (!visibleCols.includes(pinnedCol)) {
              visibleCols.push(pinnedCol);
            }
          });
          setVisibleColumns(new Set(visibleCols));
        }
      }
      if (data?.table_settings) {
        const settings = data.table_settings as any;
        if (settings.pageSize) {
          setPageSize(settings.pageSize);
        }
      }
      setColumnConfigLoaded(true);
    } catch (error) {
      console.error('Error loading table config:', error);
      setColumnConfigLoaded(true);
    }
  };
  const saveTableConfig = async () => {
    if (!user) return;
    try {
      const tableName = `assigned_prospects_${filterMode}`;
      const columnConfig = availableColumns.map(column => ({
        name: column.name,
        visible: visibleColumns.has(column.name),
        order: Array.from(visibleColumns).indexOf(column.name)
      }));
      const tableSettings = {
        pageSize,
        sortBy,
        sortOrder
      };
      const {
        error
      } = await supabase.from('sales_table_config').upsert({
        sales_user_id: user.id,
        table_name: tableName,
        column_config: columnConfig,
        table_settings: tableSettings
      }, {
        onConflict: 'sales_user_id,table_name'
      });
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Configuration des colonnes sauvegardée"
      });
    } catch (error) {
      console.error('Error saving table config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    }
  };

  // Fetch data using assigned prospects hook
  const {
    data,
    totalCount,
    totalPages,
    loading,
    refetch
  } = useAssignedProspectsData({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    searchColumns: ['email', 'first_name', 'last_name', 'company'],
    sortBy,
    sortOrder,
    visibleColumns: visibleColumnsArray,
    advancedFilters,
    salesFilters,
    filterMode
  });
  const getAllColumns = (): ColumnInfo[] => {
    const baseColumns = [{
      name: 'email',
      type: 'string',
      nullable: false
    }, {
      name: 'company',
      type: 'string',
      nullable: true
    }, {
      name: 'last_name',
      type: 'string',
      nullable: true
    }, {
      name: 'first_name',
      type: 'string',
      nullable: true
    }, {
      name: 'assigned_at',
      type: 'date',
      nullable: false
    }, {
      name: 'data_source',
      type: 'string',
      nullable: false
    }, {
      name: 'actions',
      type: 'string',
      nullable: false
    }];

    // Add callback columns for rappeler mode
    if (filterMode === 'rappeler') {
      baseColumns.splice(-2, 0, ...[{
        name: 'callback_date',
        type: 'timestamp',
        nullable: false
      }, {
        name: 'notes_sales',
        type: 'string',
        nullable: true
      }, {
        name: 'statut_prospect',
        type: 'string',
        nullable: true
      }, {
        name: 'date_action',
        type: 'date',
        nullable: true
      }]);
    }

    // Add treatment columns for traites mode
    if (filterMode === 'traites') {
      baseColumns.splice(-2, 0, ...[{
        name: 'completed_at',
        type: 'timestamp',
        nullable: false
      }, {
        name: 'notes_sales',
        type: 'string',
        nullable: true
      }, {
        name: 'statut_prospect',
        type: 'string',
        nullable: true
      }, {
        name: 'date_action',
        type: 'date',
        nullable: true
      }]);
    }
    return baseColumns;
  };
  const allColumns = getAllColumns();
  const availableColumns = allColumns;

  // Handlers
  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(item => item.id)));
    }
  };
  const toggleColumnVisibilityInDialog = (columnName: string) => {
    // Empêcher de masquer les colonnes épinglées
    if (pinnedColumns.has(columnName)) {
      return;
    }
    const newVisible = new Set(tempVisibleColumns);
    if (newVisible.has(columnName)) {
      newVisible.delete(columnName);
      setTempColumnOrder(prev => prev.filter(col => col !== columnName));
    } else {
      newVisible.add(columnName);
      setTempColumnOrder(prev => [...prev, columnName]);
    }
    setTempVisibleColumns(newVisible);
  };
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(tempColumnOrder.filter(col => tempVisibleColumns.has(col)));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const newOrder = [...items, ...tempColumnOrder.filter(col => !tempVisibleColumns.has(col))];
    setTempColumnOrder(newOrder);
  };
  const getOrderedVisibleColumns = () => {
    const visibleColumnNames = Array.from(visibleColumns);
    const orderedColumns: string[] = [];
    tempColumnOrder.forEach(colName => {
      if (visibleColumnNames.includes(colName)) {
        orderedColumns.push(colName);
      }
    });
    visibleColumnNames.forEach(colName => {
      if (!orderedColumns.includes(colName)) {
        orderedColumns.push(colName);
      }
    });
    return orderedColumns;
  };
  const openColumnDialog = () => {
    setTempVisibleColumns(new Set(visibleColumns));
    setTempColumnOrder(getOrderedVisibleColumns());
    setColumnDialogOpen(true);
  };
  const applyColumnChanges = () => {
    setVisibleColumns(new Set(tempVisibleColumns));
    const newOrder = tempColumnOrder.filter(col => tempVisibleColumns.has(col));
    setTempColumnOrder(newOrder);
    setColumnDialogOpen(false);
    setTimeout(() => {
      saveTableConfig();
    }, 100);
  };
  const cancelColumnChanges = () => {
    setTempVisibleColumns(new Set(visibleColumns));
    setTempColumnOrder(getOrderedVisibleColumns());
    setColumnDialogOpen(false);
  };
  const formatValue = (value: any, type: string, columnName?: string) => {
    if (value === null || value === undefined) return '—';
    if (type === 'boolean' && columnName === 'boucle') {
      return value ? 'Bouclé' : 'Actif';
    }
    if (type === 'date' || type === 'timestamp') {
      moment.locale('fr');
      if (columnName === 'assigned_at') {
        const now = moment();
        const assignedDate = moment(value);
        const daysDiff = now.diff(assignedDate, 'days');
        if (daysDiff > 7) {
          return assignedDate.format('D MMM YYYY');
        } else {
          return assignedDate.fromNow();
        }
      }
      if (columnName === 'completed_at') {
        const now = moment();
        const completedDate = moment(value);
        const daysDiff = now.diff(completedDate, 'days');
        if (daysDiff > 7) {
          return completedDate.format('D MMM YYYY à HH:mm');
        } else {
          return completedDate.fromNow();
        }
      }
      if (columnName === 'callback_date') {
        const now = moment();
        const callbackDate = moment(value);
        const daysDiff = now.diff(callbackDate, 'days');
        if (Math.abs(daysDiff) > 7) {
          return callbackDate.format('D MMM YYYY à HH:mm');
        } else {
          return callbackDate.fromNow();
        }
      }
      if (columnName === 'date_action') {
        const now = moment();
        const actionDate = moment(value);
        const daysDiff = now.diff(actionDate, 'days');
        if (Math.abs(daysDiff) > 7) {
          return actionDate.format('D MMM YYYY à HH:mm');
        } else {
          return actionDate.fromNow();
        }
      }
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (type === 'number') {
      return value.toLocaleString('fr-FR');
    }
    return value.toString();
  };
  const getStatusBadgeClass = (status: string) => {
    const statusColors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'qualified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    return statusColors[status?.toLowerCase()] || statusColors.new;
  };
  const hideColumn = (columnName: string) => {
    // Empêcher de masquer les colonnes épinglées
    if (pinnedColumns.has(columnName)) {
      return;
    }
    const newVisible = new Set(visibleColumns);
    newVisible.delete(columnName);
    setVisibleColumns(newVisible);
  };
  const handleColumnFilter = (columnName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));

    // Afficher automatiquement la colonne si un filtre est appliqué
    if (value && !visibleColumns.has(columnName)) {
      setVisibleColumns(prev => new Set([...prev, columnName]));
    }
  };
  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = {
        ...prev
      };
      delete newFilters[columnName];
      return newFilters;
    });
  };

  // Export functions
  const handleExport = async (options: ExportOptions) => {
    try {
      const exportParams = {
        page: options.scope === 'current' ? currentPage : 1,
        pageSize: options.scope === 'current' ? pageSize : totalCount,
        searchTerm: debouncedSearchTerm,
        searchColumns: ['email', 'first_name', 'last_name', 'company'],
        sortBy,
        sortOrder,
        visibleColumns: Array.from(visibleColumns),
        advancedFilters,
        filterMode
      };
      
      const { data: exportData, error } = await supabase.functions.invoke('assigned-prospects', {
        body: exportParams
      });
      
      if (error) throw error;
      const prospects = exportData.data || [];
      
      if (prospects.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucun prospect à exporter avec les filtres appliqués",
          variant: "destructive",
          duration: 4000
        });
        return;
      }

      // Filter columns based on user selection
      const selectedColumns = options.columns.length > 0 
        ? options.columns 
        : Object.keys(prospects[0]);

      // Préparer les données filtrées
      const filteredProspects = prospects.map((prospect: any) => {
        const filtered: any = {};
        selectedColumns.forEach(col => {
          filtered[col] = prospect[col];
        });
        return filtered;
      });

      // Export based on format
      switch (options.format) {
        case 'xlsx':
          await exportAsExcel(filteredProspects, selectedColumns, options.filename);
          break;
        case 'csv':
          await exportAsCSV(filteredProspects, selectedColumns, options.filename, options.csvOptions);
          break;
        case 'json':
          await exportAsJSON(filteredProspects, options.filename);
          break;
      }

      toast({
        title: "Export réussi",
        description: `${prospects.length} prospects exportés dans ${options.filename}.${options.format}`,
        duration: 3000
      });

      if (options.includeGoogleSheets) {
        toast({
          title: "Google Sheets",
          description: "La synchronisation Google Sheets sera disponible prochainement",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
        duration: 4000
      });
    }
  };

  const exportAsExcel = async (prospects: any[], columns: string[], filename: string) => {
    const workbook = XLSX.utils.book_new();
    const headers = columns.map(key => translateColumnName(key));
    
    const exportRows = prospects.map(prospect => 
      columns.map(key => {
        const value = prospect[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object' && value instanceof Date) {
          moment.locale('fr');
          return moment(value).format('D MMM YYYY');
        }
        return String(value);
      })
    );

    const worksheetData = [headers, ...exportRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style headers
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "3B82F6" } },
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center" }
      };
    }

    // Adjust column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    const sheetName = 'Prospects Assignés';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportAsCSV = async (
    prospects: any[], 
    columns: string[], 
    filename: string, 
    csvOptions?: ExportOptions['csvOptions']
  ) => {
    const delimiter = csvOptions?.delimiter || ',';
    const includeHeaders = csvOptions?.includeHeaders !== false;
    const quoteStrings = csvOptions?.quoteStrings !== false;
    
    const escapeValue = (value: any) => {
      if (value === null || value === undefined) return '';
      let str = String(value);
      
      if (quoteStrings && (str.includes(delimiter) || str.includes('"') || str.includes('\n'))) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      
      return str;
    };
    
    const headers = columns.map(key => translateColumnName(key));
    const rows = prospects.map(prospect => 
      columns.map(key => {
        const value = prospect[key];
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        if (Array.isArray(value)) return escapeValue(value.join(', '));
        if (value instanceof Date) return escapeValue(moment(value).format('D MMM YYYY'));
        return escapeValue(value);
      }).join(delimiter)
    );

    let csvContent = '';
    if (includeHeaders) {
      csvContent = headers.map(h => escapeValue(h)).join(delimiter) + '\n';
    }
    csvContent += rows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportAsJSON = async (prospects: any[], filename: string) => {
    const jsonContent = JSON.stringify(prospects, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const handleSort = (columnName: string, order?: 'asc' | 'desc') => {
    if (order) {
      setSortBy(columnName);
      setSortOrder(order);
    } else {
      if (sortBy === columnName) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(columnName);
        setSortOrder('asc');
      }
    }
    setCurrentPage(1);
  };
  return <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {filterMode === 'traites' ? 'Prospects Traités' : filterMode === 'rappeler' ? 'Prospects à Rappeler' : 'Prospects Assignés'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filterMode === 'traites' ? `${totalCount} prospects bouclés ou avec statut "barrage" / "déjà accompagné"` : filterMode === 'rappeler' ? `${totalCount} prospects à rappeler` : `${totalCount} prospects assignés depuis vos différentes sources`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {filterMode === 'rappeler' && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={async () => {
                try {
                  toast({
                    title: 'Test en cours',
                    description: 'Envoi des emails de rappel...',
                  });

                  const { data, error } = await supabase.functions.invoke('send-callback-reminders', {
                    body: {}
                  });

                  if (error) throw error;

                  toast({
                    title: 'Test réussi !',
                    description: `${data?.total_prospects || 0} email(s) envoyé(s) à ${data?.total_users || 0} utilisateur(s)`,
                  });
                } catch (error) {
                  console.error('Error testing reminders:', error);
                  toast({
                    title: 'Erreur',
                    description: 'Impossible d\'envoyer les emails de test',
                    variant: 'destructive',
                  });
                }
              }}
            >
              📧 Tester l'envoi d'emails
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher des prospects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>

              {/* Filters */}
              <TableFilters tableName="apollo_contacts" filters={advancedFilters} onFiltersChange={setAdvancedFilters} onReset={() => setAdvancedFilters({})} isOpen={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} showOnlyButton={true} />

              {/* Column visibility */}
              <Button variant="outline" size="sm" onClick={openColumnDialog}>
                <Columns className="h-4 w-4 mr-2" />
                Colonnes
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Selection info */}
            {selectedRows.size > 0 && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedRows.size} sélectionné{selectedRows.size > 1 ? 's' : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>
                  <X className="h-4 w-4" />
                </Button>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {filtersOpen && <TableFilters tableName="apollo_contacts" filters={advancedFilters} onFiltersChange={setAdvancedFilters} onReset={() => setAdvancedFilters({})} isOpen={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />}
      </AnimatePresence>

      {/* Sales Filters - similar to SalesProspects page */}
      <SalesProspectsFilters
        filters={salesFilters}
        onFiltersChange={setSalesFilters}
        onReset={() => setSalesFilters({})}
        isFilterExpanded={isFilterExpanded}
        onFilterExpandedChange={setIsFilterExpanded}
      />

      {/* Table */}
      <Card>
        {loading ? <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Chargement des prospects...</span>
            </div>
          </div> : <div ref={tableContainerRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Colonne checkbox - épinglée */}
                  <TableHead className="w-[50px] px-3 py-3 text-left sticky top-0 left-0 bg-background border-r z-50">
                    <Checkbox checked={data.length > 0 && selectedRows.size === data.length} onCheckedChange={handleSelectAll} aria-label="Sélectionner tous" />
                  </TableHead>
                  
                  {/* Colonne email - épinglée */}
                  {visibleColumns.has('email') && <TableHead className="w-[200px] px-4 py-3 text-left sticky top-0 bg-background border-r z-40" style={{
                left: '50px'
              }}>
                      <TableColumnHeader columnName="email" displayName={translateColumnName('email')} sortBy={sortBy} sortOrder={sortOrder} isPinned={true} canPin={false} canHide={false} onSort={handleSort} onPin={() => {}} onHide={hideColumn} onFilter={handleColumnFilter} onClearFilter={clearColumnFilter} filterValue={columnFilters['email'] || ''} />
                    </TableHead>}
                  
                   {/* Autres colonnes */}
                   {availableColumns.map(column => {
                if (!visibleColumns.has(column.name) || column.name === 'email') return null;
                return <TableHead key={column.name} className="px-4 py-3 text-left min-w-[120px] sticky top-0 bg-background z-20">
                         {column.name === 'actions' ? 'Actions' : <TableColumnHeader columnName={column.name} displayName={translateColumnName(column.name)} sortBy={sortBy} sortOrder={sortOrder} isPinned={false} canPin={false} canHide={!pinnedColumns.has(column.name)} onSort={handleSort} onPin={() => {}} onHide={hideColumn} onFilter={handleColumnFilter} onClearFilter={clearColumnFilter} filterValue={columnFilters[column.name] || ''} />}
                       </TableHead>;
              })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? <TableRow>
                    <TableCell colSpan={Array.from(visibleColumns).length + 2} className="text-center py-8 text-muted-foreground">
                      Aucun prospect assigné trouvé
                    </TableCell>
                  </TableRow> : data.map(prospect => <TableRow key={prospect.id} className={selectedRows.has(prospect.id) ? 'bg-muted/50' : ''}>
                      {/* Colonne checkbox */}
                      <TableCell className="w-[50px] px-3 py-3 sticky left-0 bg-background border-r z-30">
                        <Checkbox checked={selectedRows.has(prospect.id)} onCheckedChange={() => handleRowSelect(prospect.id)} aria-label={`Sélectionner ${prospect.first_name} ${prospect.last_name}`} />
                      </TableCell>
                      
                      {/* Colonne email */}
                      {visibleColumns.has('email') && <TableCell className="w-[200px] px-4 py-3 sticky bg-background border-r z-20" style={{
                left: '50px'
              }}>
                          <div className="flex items-center gap-2">
                            <a href={`mailto:${prospect.email}`} className="text-primary hover:underline">
                              {prospect.email}
                            </a>
                            {filterMode === 'traites' && <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200/80">
                                Traité
                              </Badge>}
                            {filterMode === 'rappeler' && <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200 text-xs hover:bg-orange-200/80">
                                À rappeler
                              </Badge>}
                          </div>
                        </TableCell>}
                      
                      {/* Autres colonnes */}
                      {availableColumns.map(column => {
                if (!visibleColumns.has(column.name) || column.name === 'email') return null;
                return <TableCell key={column.name} className="px-4 py-3 min-w-[120px]">
                            {column.name === 'apollo_status' || column.name === 'zoho_status' ? <Badge className={getStatusBadgeClass(prospect[column.name])}>
                                {prospect[column.name] || 'Non défini'}
                              </Badge> : column.name === 'source_table' || column.name === 'data_source' ? <Badge variant="outline">
                                 {prospect.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM'}
                                </Badge> : column.name === 'boucle' ? <Badge className={prospect[column.name] ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                                  {formatValue(prospect[column.name], column.type, column.name)}
                                </Badge> : column.name === 'completed_at' ? <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                  {formatValue(prospect[column.name], column.type, column.name)}
                                </Badge> : column.name === 'statut_prospect' && prospect[column.name] ? <Badge variant="secondary">
                                  {prospect[column.name]}
                               </Badge> : column.name === 'notes_sales' ? <div className="max-w-xs truncate" title={prospect[column.name] || ''}>
                                 {prospect[column.name] || '—'}
                               </div> : column.name === 'actions' ? <div className="flex items-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(createProspectUrl(prospect.email))}>
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Voir les détails</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Supprimer l'assignation</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div> : column.name === 'person_linkedin_url' && prospect[column.name] ? <a href={prospect[column.name]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                LinkedIn
                              </a> : column.name === 'website' && prospect[column.name] ? <a href={prospect[column.name]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Site web
                              </a> : formatValue(prospect[column.name], column.type, column.name)}
                          </TableCell>;
              })}
                    </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </Card>

      {/* Pagination */}
      {!loading && totalCount > 0 && <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} prospects assignés
            {selectedRows.size > 0 && ` • ${selectedRows.size} sélectionné${selectedRows.size > 1 ? 's' : ''}`}
          </div>
          
          <DataPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalCount} onPageChange={setCurrentPage} onPageSizeChange={size => {
        setPageSize(size);
        setCurrentPage(1);
      }} loading={loading} />
        </div>}

      {/* Dialog de gestion des colonnes */}
      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent className="max-w-5xl w-[90vw] h-[80vh] bg-background flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Gestion des colonnes</DialogTitle>
            <DialogDescription>
              Glissez et déposez les colonnes pour réorganiser leur ordre d'affichage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Colonnes affichées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-green-600 flex-shrink-0">
                Colonnes affichées ({tempColumnOrder.filter(col => tempVisibleColumns.has(col)).length})
              </h3>
              <div className="border rounded-lg p-3 bg-green-50/50 flex-1 overflow-y-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="visible-columns">
                    {(provided, snapshot) => <div {...provided.droppableProps} ref={provided.innerRef} className={`space-y-2 min-h-[100px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-green-100/70 rounded-lg' : ''}`}>
                        {tempColumnOrder.filter(colName => tempVisibleColumns.has(colName)).map((colName, index) => {
                      const column = availableColumns.find(col => col.name === colName);
                      if (!column) return null;
                      return <Draggable key={column.name} draggableId={column.name} index={index}>
                              {(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-2 p-2 bg-background rounded border border-green-200 hover:border-green-300 transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-1 bg-green-50 z-50' : 'hover:shadow-md'}`}>
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors duration-150">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium flex-1">{translateColumnName(column.name)}</span>
                                   {!pinnedColumns.has(column.name) ? <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibilityInDialog(column.name)} className="h-8 w-8 p-0 hover:bg-red-100 transition-colors duration-200">
                                       <ArrowRight className="h-4 w-4 text-red-600" />
                                     </Button> : <span className="text-xs text-gray-500 px-2">Épinglée</span>}
                                </div>}
                            </Draggable>;
                    })}
                        {provided.placeholder}
                      </div>}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>

            {/* Colonnes masquées */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-gray-600 flex-shrink-0">
                Colonnes masquées ({availableColumns.filter(col => !tempVisibleColumns.has(col.name)).length})
              </h3>
              <div className="border rounded-lg p-3 bg-gray-50/50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {availableColumns.filter(col => !tempVisibleColumns.has(col.name)).map(column => <div key={column.name} className="flex items-center justify-between p-2 bg-background rounded border border-gray-200 hover:border-gray-300 transition-colors duration-200 hover:shadow-sm">
                      <span className="text-sm flex-1 mr-2">{translateColumnName(column.name)}</span>
                      <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibilityInDialog(column.name)} className="h-8 w-8 p-0 hover:bg-green-100 transition-colors duration-200">
                        <ArrowLeftRight className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>)}
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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        tableName="crm_contacts"
        totalCount={totalCount}
        currentPageCount={data.length}
        appliedFilters={{
          searchTerm: debouncedSearchTerm,
          ...advancedFilters
        }}
        onExport={handleExport}
      />
    </div>;
};
export default MySalesLeads;