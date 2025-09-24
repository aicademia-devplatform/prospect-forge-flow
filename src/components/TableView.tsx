import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Download, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ExternalLink, MoreHorizontal, X, ChevronDown, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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

const TableView: React.FC<TableViewProps> = ({ tableName, onBack }) => {
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Memoize visible columns array to prevent infinite re-renders
  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);

  // Fetch data using server-side pagination
  const { data, totalCount, totalPages, loading } = useTableData({
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
  const { sections } = useTableSections(tableName);

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

  // Filter sections based on search term
  const filteredSections = sections.filter(section => 
    section.label.toLowerCase().includes(sectionSearchTerm.toLowerCase())
  );

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
      return [
        { name: 'id', type: 'string', nullable: false },
        { name: 'email', type: 'string', nullable: false },
        { name: 'first_name', type: 'string', nullable: true },
        { name: 'last_name', type: 'string', nullable: true },
        { name: 'company', type: 'string', nullable: true },
        { name: 'title', type: 'string', nullable: true },
        { name: 'seniority', type: 'string', nullable: true },
        { name: 'departments', type: 'string', nullable: true },
        { name: 'activity', type: 'string', nullable: true },
        { name: 'lifecycle_stage', type: 'string', nullable: true },
        { name: 'categorie_fonction', type: 'string', nullable: true },
        { name: 'stage', type: 'string', nullable: true },
        { name: 'technologies', type: 'string', nullable: true },
        { name: 'secteur_activite', type: 'string', nullable: true },
        { name: 'company_phone', type: 'string', nullable: true },
        { name: 'company_country', type: 'string', nullable: true },
        { name: 'company_state', type: 'string', nullable: true },
        { name: 'company_city', type: 'string', nullable: true },
        { name: 'company_address', type: 'string', nullable: true },
        { name: 'country', type: 'string', nullable: true },
        { name: 'state', type: 'string', nullable: true },
        { name: 'city', type: 'string', nullable: true },
        { name: 'twitter_url', type: 'string', nullable: true },
        { name: 'facebook_url', type: 'string', nullable: true },
        { name: 'company_linkedin_url', type: 'string', nullable: true },
        { name: 'website', type: 'string', nullable: true },
        { name: 'person_linkedin_url', type: 'string', nullable: true },
        { name: 'subsidiary_of', type: 'string', nullable: true },
        { name: 'statut', type: 'string', nullable: true },
        { name: 'contact_owner', type: 'string', nullable: true },
        { name: 'account_owner', type: 'string', nullable: true },
        { name: 'work_direct_phone', type: 'string', nullable: true },
        { name: 'home_phone', type: 'string', nullable: true },
        { name: 'mobile_phone', type: 'string', nullable: true },
        { name: 'corporate_phone', type: 'string', nullable: true },
        { name: 'other_phone', type: 'string', nullable: true },
        { name: 'region', type: 'string', nullable: true },
        { name: 'industry', type: 'string', nullable: true },
        { name: 'keywords', type: 'string', nullable: true },
        { name: 'secondary_email', type: 'string', nullable: true },
        { name: 'tertiary_email', type: 'string', nullable: true },
        { name: 'num_employees', type: 'number', nullable: true },
        { name: 'nb_employees', type: 'number', nullable: true },
        { name: 'annual_revenue', type: 'number', nullable: true },
        { name: 'total_funding', type: 'number', nullable: true },
        { name: 'latest_funding', type: 'number', nullable: true },
        { name: 'email_sent', type: 'boolean', nullable: true },
        { name: 'email_open', type: 'boolean', nullable: true },
        { name: 'email_bounced', type: 'boolean', nullable: true },
        { name: 'replied', type: 'boolean', nullable: true },
        { name: 'demoed', type: 'boolean', nullable: true },
        { name: 'apollo_account_id', type: 'string', nullable: true },
        { name: 'apollo_contact_id', type: 'string', nullable: true },
        { name: 'email_status', type: 'string', nullable: true },
        { name: 'primary_email_source', type: 'string', nullable: true },
        { name: 'email_confidence', type: 'string', nullable: true },
        { name: 'created_at', type: 'string', nullable: true },
        { name: 'updated_at', type: 'string', nullable: true },
        { name: 'last_sync_at', type: 'string', nullable: true },
        { name: 'primary_email_last_verified_at', type: 'string', nullable: true },
        { name: 'last_raised_at', type: 'string', nullable: true },
        { name: 'last_contacted', type: 'string', nullable: true },
      ];
    } else {
      return [
        { name: 'id', type: 'number', nullable: false },
        { name: 'email', type: 'string', nullable: false },
        { name: 'firstname', type: 'string', nullable: true },
        { name: 'name', type: 'string', nullable: true },
        { name: 'company', type: 'string', nullable: true },
        { name: 'data_section', type: 'string', nullable: true },
        { name: 'full_name', type: 'string', nullable: true },
        { name: 'email_domain', type: 'string', nullable: true },
        { name: 'contact_active', type: 'string', nullable: true },
        { name: 'tel', type: 'string', nullable: true },
        { name: 'mobile', type: 'string', nullable: true },
        { name: 'mobile_2', type: 'string', nullable: true },
        { name: 'tel_pro', type: 'string', nullable: true },
        { name: 'address', type: 'string', nullable: true },
        { name: 'city', type: 'string', nullable: true },
        { name: 'departement', type: 'string', nullable: true },
        { name: 'country', type: 'string', nullable: true },
        { name: 'nb_employees', type: 'string', nullable: true },
        { name: 'linkedin_function', type: 'string', nullable: true },
        { name: 'industrie', type: 'string', nullable: true },
        { name: 'linkedin_url', type: 'string', nullable: true },
        { name: 'linkedin_company_url', type: 'string', nullable: true },
        { name: 'company_website', type: 'string', nullable: true },
        { name: 'systemeio_list', type: 'string', nullable: true },
        { name: 'apollo_list', type: 'string', nullable: true },
        { name: 'brevo_tag', type: 'string', nullable: true },
        { name: 'zoho_tag', type: 'string', nullable: true },
        { name: 'zoho_status', type: 'string', nullable: true },
        { name: 'apollo_status', type: 'string', nullable: true },
        { name: 'arlynk_status', type: 'string', nullable: true },
        { name: 'aicademia_high_status', type: 'string', nullable: true },
        { name: 'aicademia_low_status', type: 'string', nullable: true },
        { name: 'zoho_ma_score', type: 'string', nullable: true },
        { name: 'zoho_crm_notation_score', type: 'string', nullable: true },
        { name: 'arlynk_score', type: 'string', nullable: true },
        { name: 'aicademia_score', type: 'string', nullable: true },
        { name: 'total_score', type: 'number', nullable: true },
        { name: 'apollo_email_verification', type: 'string', nullable: true },
        { name: 'apollo_owner', type: 'string', nullable: true },
        { name: 'apollo_last_contact', type: 'string', nullable: true },
        { name: 'apollo_description', type: 'string', nullable: true },
        { name: 'arlynk_cold_status', type: 'string', nullable: true },
        { name: 'arlynk_cold_note', type: 'string', nullable: true },
        { name: 'arlynk_cold_action_date', type: 'string', nullable: true },
        { name: 'arlynk_cold_relance2', type: 'string', nullable: true },
        { name: 'arlynk_cold_relance3', type: 'string', nullable: true },
        { name: 'aicademia_cold_status', type: 'string', nullable: true },
        { name: 'aicademia_cold_note', type: 'string', nullable: true },
        { name: 'aicademia_cold_action_date', type: 'string', nullable: true },
        { name: 'aicademia_cold_relance2', type: 'string', nullable: true },
        { name: 'aicademia_cold_relance3', type: 'string', nullable: true },
        { name: 'brevo_last_mail_campain', type: 'string', nullable: true },
        { name: 'brevo_last_sms_campain', type: 'string', nullable: true },
        { name: 'brevo_unsuscribe', type: 'string', nullable: true },
        { name: 'brevo_open_number', type: 'string', nullable: true },
        { name: 'brevo_click_number', type: 'string', nullable: true },
        { name: 'brevo_reply_number', type: 'string', nullable: true },
        { name: 'hubspot_lead_status', type: 'string', nullable: true },
        { name: 'hubspot_contact_owner', type: 'string', nullable: true },
        { name: 'hubspot_life_cycle_phase', type: 'string', nullable: true },
        { name: 'hubspot_buy_role', type: 'string', nullable: true },
        { name: 'hubspot_created_at', type: 'string', nullable: true },
        { name: 'hubspot_modified_at', type: 'string', nullable: true },
        { name: 'hubspot_last_activity', type: 'string', nullable: true },
        { name: 'hubspot_notes', type: 'string', nullable: true },
        { name: 'hubspot_anis_comment', type: 'string', nullable: true },
        { name: 'zoho_created_at', type: 'string', nullable: true },
        { name: 'zoho_updated_at', type: 'string', nullable: true },
        { name: 'zoho_updated_by', type: 'string', nullable: true },
        { name: 'zoho_report_to', type: 'string', nullable: true },
        { name: 'zoho_description', type: 'string', nullable: true },
        { name: 'zoho_last_activity', type: 'string', nullable: true },
        { name: 'zoho_product_interest', type: 'string', nullable: true },
        { name: 'zoho_status_2', type: 'string', nullable: true },
        { name: 'zoho_industrie_tag', type: 'string', nullable: true },
        { name: 'created_at', type: 'string', nullable: true },
        { name: 'updated_at', type: 'string', nullable: true },
      ];
    }
  };

  const allColumns = getAllColumns();

  // Initialize visible columns (exclude email and actions from toggleable columns)
  useEffect(() => {
    const defaultColumns = ['id', 'email', 'firstname', 'name', 'first_name', 'last_name', 'company', 'data_section', 'created_at'];
    const toggleableColumns = allColumns.filter(col => col.name !== 'email' && col.name !== 'id').map(col => col.name);
    const initialVisible = toggleableColumns.filter(col => defaultColumns.includes(col));
    setVisibleColumns(new Set(initialVisible));
  }, [tableName]);

  // Get columns that should be displayed
  const displayColumns = allColumns.filter(col => 
    col.name === 'email' || col.name === 'id' || visibleColumns.has(col.name)
  );

  // Filter columns for search
  const filteredColumns = allColumns
    .filter(col => col.name !== 'email' && col.name !== 'id')
    .filter(col => col.name.toLowerCase().includes(columnSearchTerm.toLowerCase()));

  const toggleColumnVisibility = (columnName: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnName)) {
      newVisible.delete(columnName);
    } else {
      newVisible.add(columnName);
    }
    setVisibleColumns(newVisible);
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
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
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
        return (
          <div className="flex flex-wrap gap-1">
            {sections.map((section: string, index: number) => {
              const colorClass = generateSectionColor(section);
              return (
                <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
                  {section}
                </span>
              );
            })}
          </div>
        );
      } else {
        const colorClass = generateSectionColor(value);
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${colorClass}`}>
            {value}
          </span>
        );
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
      return (
        <span title={value} className="text-sm">
          {value.substring(0, 40)}...
        </span>
      );
    }
    
    return <span className="text-sm">{value}</span>;
  };

  const tableTitle = tableName === 'apollo_contacts' ? 'Contacts Apollo' : 'Contacts CRM';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
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
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {tableName === 'crm_contacts' && sections.length > 0 && (
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                {sections.map((section) => {
                  const isSelected = selectedSections.includes(section.value);
                  
                  return (
                    <Tooltip key={section.value}>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 border ${
                            isSelected 
                              ? generateSectionColor(section.value)
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          onClick={() => toggleSection(section.value)}
                        >
                          {section.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isSelected ? `Filtrer par ${section.value} (cliquer pour désactiver)` : `Filtrer par ${section.value} (cliquer pour activer)`}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Input
                  placeholder="Rechercher une colonne..."
                  value={columnSearchTerm}
                  onChange={(e) => setColumnSearchTerm(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <DropdownMenuSeparator />
              {filteredColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.name}
                  checked={visibleColumns.has(column.name)}
                  onCheckedChange={() => toggleColumnVisibility(column.name)}
                >
                  {column.name}
                </DropdownMenuCheckboxItem>
              ))}
              {filteredColumns.length === 0 && columnSearchTerm && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Aucune colonne trouvée
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des données...</span>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table Header with selection controls */}
            {selectedRows.size > 0 && (
              <div className="px-6 py-4 bg-primary/5 border-b border-border">
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
              </div>
            )}

            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-table-border hover:bg-transparent">
                  <TableHead className="w-12 bg-table-header">
                    <Checkbox
                      checked={selectedRows.size === data.length && data.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  {displayColumns.slice(0, displayColumns.length - 1).map((column) => (
                    <TableHead 
                      key={column.name} 
                      className="font-semibold text-muted-foreground bg-table-header cursor-pointer hover:bg-muted/80 transition-colors py-4"
                      onClick={() => handleSort(column.name)}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="uppercase text-xs tracking-wider">{column.name}</span>
                        {getSortIcon(column.name)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="bg-table-header w-20 text-center">
                    <span className="uppercase text-xs tracking-wider font-semibold text-muted-foreground">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="overflow-auto max-h-[600px]">
              <Table className="w-full">
                <TableBody>
                  {data.map((row, index) => {
                    const rowId = row.id?.toString() || index.toString();
                    const isSelected = selectedRows.has(rowId);
                    
                    return (
                      <TableRow 
                        key={rowId}
                        className={`border-b border-table-border hover:bg-table-row-hover transition-colors ${
                          isSelected ? 'bg-table-selected' : ''
                        }`}
                      >
                        <TableCell className="w-12">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                            aria-label={`Sélectionner ligne ${index + 1}`}
                          />
                        </TableCell>
                        {displayColumns.slice(0, displayColumns.length - 1).map((column) => (
                          <TableCell key={column.name} className="py-4">
                            {formatCellValue(row[column.name], column.name)}
                          </TableCell>
                        ))}
                        <TableCell className="w-20">
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-table-border bg-muted/20">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableView;