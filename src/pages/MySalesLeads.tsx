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
import { ArrowLeft, Search, Download, Loader2, MoreHorizontal, X, ChevronDown, Columns, UserPlus, ExternalLink, GripVertical, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataPagination from '@/components/DataPagination';
import TableFilters, { FilterValues } from '@/components/TableFilters';
import TableColumnHeader from '@/components/TableColumnHeader';
import { useAssignedProspectsData } from '@/hooks/useAssignedProspectsData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

  // Fonction de traduction des noms de colonnes
  const translateColumnName = (columnName: string): string => {
    const translations: Record<string, string> = {
      'id': 'ID',
      'email': 'Email',
      'created_at': 'Date de création',
      'updated_at': 'Date de mise à jour',
      'assigned_at': 'Date d\'assignation',
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
      'actions': 'Actions'
    };
    return translations[columnName] || columnName;
  };

const MySalesLeads: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('assigned_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['email', 'company', 'last_name', 'first_name', 'assigned_at', 'data_source', 'actions']));
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Colonnes épinglées fixes
  const pinnedColumns = new Set(['email']);

  // Charger la configuration des colonnes au montage
  useEffect(() => {
    if (user && !columnConfigLoaded) {
      loadTableConfig();
    }
  }, [user, columnConfigLoaded]);

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
      const { data, error } = await supabase
        .from('sales_table_config')
        .select('column_config, table_settings')
        .eq('sales_user_id', user.id)
        .eq('table_name', 'assigned_prospects')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.column_config) {
        const config = Array.isArray(data.column_config) ? data.column_config : [];
        setCustomColumns(config);

        if (config.length > 0) {
          const visibleCols = config.filter((col: any) => col.visible !== false).map((col: any) => col.name);
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
      const columnConfig = availableColumns.map(column => ({
        name: column.name,
        visible: visibleColumns.has(column.name),
        order: Array.from(visibleColumns).indexOf(column.name)
      }));

      const tableSettings = { pageSize, sortBy, sortOrder };

      const { error } = await supabase
        .from('sales_table_config')
        .upsert({
          sales_user_id: user.id,
          table_name: 'assigned_prospects',
          column_config: columnConfig,
          table_settings: tableSettings
        }, { onConflict: 'sales_user_id,table_name' });

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
  const { data, totalCount, totalPages, loading, refetch } = useAssignedProspectsData({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    searchColumns: ['email', 'first_name', 'last_name', 'company'],
    sortBy,
    sortOrder,
    visibleColumns: visibleColumnsArray,
    advancedFilters
  });

  // Définir les colonnes disponibles (seulement les colonnes de base)
  const getAllColumns = (): ColumnInfo[] => {
    return [
      { name: 'email', type: 'string', nullable: false },
      { name: 'company', type: 'string', nullable: true },
      { name: 'last_name', type: 'string', nullable: true },
      { name: 'first_name', type: 'string', nullable: true },
      { name: 'assigned_at', type: 'date', nullable: false },
      { name: 'data_source', type: 'string', nullable: false },
      { name: 'actions', type: 'string', nullable: false }
    ];
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
    if (!value) return '—';
    if (type === 'date') {
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
    const newVisible = new Set(visibleColumns);
    newVisible.delete(columnName);
    setVisibleColumns(newVisible);
  };

  const handleColumnFilter = (columnName: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnName]: value }));
    
    // Afficher automatiquement la colonne si un filtre est appliqué
    if (value && !visibleColumns.has(columnName)) {
      setVisibleColumns(prev => new Set([...prev, columnName]));
    }
  };

  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prospects Assignés</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} prospects assignés depuis vos différentes sources
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveTableConfig}>
            <Download className="h-4 w-4 mr-2" />
            Sauvegarder Config
          </Button>
          <Button variant="outline" size="sm">
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
                <Input 
                  placeholder="Rechercher des prospects..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>

              {/* Filters */}
              <TableFilters 
                tableName="apollo_contacts"
                filters={advancedFilters} 
                onFiltersChange={setAdvancedFilters} 
                onReset={() => setAdvancedFilters({})} 
                isOpen={filtersOpen} 
                onToggle={() => setFiltersOpen(!filtersOpen)} 
                showOnlyButton={true} 
              />

              {/* Column visibility */}
              <Button variant="outline" size="sm" onClick={openColumnDialog}>
                <Columns className="h-4 w-4 mr-2" />
                Colonnes
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Selection info */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedRows.size} sélectionné{selectedRows.size > 1 ? 's' : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {filtersOpen && (
          <TableFilters 
            tableName="apollo_contacts" 
            filters={advancedFilters} 
            onFiltersChange={setAdvancedFilters} 
            onReset={() => setAdvancedFilters({})} 
            isOpen={filtersOpen} 
            onToggle={() => setFiltersOpen(!filtersOpen)} 
          />
        )}
      </AnimatePresence>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Chargement des prospects...</span>
            </div>
          </div>
        ) : (
          <div ref={tableContainerRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Colonne checkbox - épinglée */}
                  <TableHead className="w-[50px] px-3 py-3 text-left sticky top-0 left-0 bg-background border-r z-50">
                    <Checkbox 
                      checked={data.length > 0 && selectedRows.size === data.length} 
                      onCheckedChange={handleSelectAll} 
                      aria-label="Sélectionner tous" 
                    />
                  </TableHead>
                  
                  {/* Colonne email - épinglée */}
                  {visibleColumns.has('email') && (
                    <TableHead 
                      className="w-[200px] px-4 py-3 text-left sticky top-0 bg-background border-r z-40"
                      style={{ left: '50px' }}
                    >
                      <TableColumnHeader 
                        columnName="email" 
                        displayName={translateColumnName('email')} 
                        sortBy={sortBy} 
                        sortOrder={sortOrder} 
                        isPinned={true} 
                        canPin={false} 
                        canHide={false} 
                        onSort={handleSort} 
                        onPin={() => {}} 
                        onHide={hideColumn} 
                        onFilter={handleColumnFilter} 
                        onClearFilter={clearColumnFilter} 
                        filterValue={columnFilters['email'] || ''} 
                      />
                    </TableHead>
                  )}
                  
                  {/* Autres colonnes */}
                  {availableColumns.map(column => {
                    if (!visibleColumns.has(column.name) || column.name === 'email') return null;
                    return (
                      <TableHead key={column.name} className="px-4 py-3 text-left min-w-[120px] sticky top-0 bg-background z-20">
                        <TableColumnHeader 
                          columnName={column.name} 
                          displayName={translateColumnName(column.name)} 
                          sortBy={sortBy} 
                          sortOrder={sortOrder} 
                          isPinned={false} 
                          canPin={false} 
                          canHide={column.name !== 'id'} 
                          onSort={handleSort} 
                          onPin={() => {}} 
                          onHide={hideColumn} 
                          onFilter={handleColumnFilter} 
                          onClearFilter={clearColumnFilter} 
                          filterValue={columnFilters[column.name] || ''} 
                        />
                      </TableHead>
                    );
                  })}
                  
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Array.from(visibleColumns).length + 2} className="text-center py-8 text-muted-foreground">
                      Aucun prospect assigné trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map(prospect => (
                    <TableRow key={prospect.id} className={selectedRows.has(prospect.id) ? 'bg-muted/50' : ''}>
                      {/* Colonne checkbox */}
                      <TableCell className="w-[50px] px-3 py-3 sticky left-0 bg-background border-r z-30">
                        <Checkbox 
                          checked={selectedRows.has(prospect.id)} 
                          onCheckedChange={() => handleRowSelect(prospect.id)} 
                          aria-label={`Sélectionner ${prospect.first_name} ${prospect.last_name}`} 
                        />
                      </TableCell>
                      
                      {/* Colonne email */}
                      {visibleColumns.has('email') && (
                        <TableCell 
                          className="w-[200px] px-4 py-3 sticky bg-background border-r z-20"
                          style={{ left: '50px' }}
                        >
                          <a href={`mailto:${prospect.email}`} className="text-primary hover:underline">
                            {prospect.email}
                          </a>
                        </TableCell>
                      )}
                      
                      {/* Autres colonnes */}
                      {availableColumns.map(column => {
                        if (!visibleColumns.has(column.name) || column.name === 'email') return null;
                        return (
                          <TableCell key={column.name} className="px-4 py-3 min-w-[120px]">
                            {column.name === 'apollo_status' || column.name === 'zoho_status' ? (
                              <Badge className={getStatusBadgeClass(prospect[column.name])}>
                                {prospect[column.name] || 'Non défini'}
                              </Badge>
                             ) : column.name === 'source_table' || column.name === 'data_source' ? (
                               <Badge variant="outline">
                                 {prospect.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM'}
                               </Badge>
                             ) : column.name === 'actions' ? (
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm">
                                     <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuCheckboxItem>
                                     Voir les détails
                                   </DropdownMenuCheckboxItem>
                                   {prospect.person_linkedin_url && (
                                     <DropdownMenuCheckboxItem asChild>
                                       <a href={prospect.person_linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                         <ExternalLink className="h-4 w-4 mr-2" />
                                         LinkedIn
                                       </a>
                                     </DropdownMenuCheckboxItem>
                                   )}
                                   <DropdownMenuSeparator />
                                   <DropdownMenuCheckboxItem className="text-destructive">
                                     Retirer l'assignation
                                   </DropdownMenuCheckboxItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             ) : column.name === 'person_linkedin_url' && prospect[column.name] ? (
                              <a href={prospect[column.name]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                LinkedIn
                              </a>
                            ) : column.name === 'website' && prospect[column.name] ? (
                              <a href={prospect[column.name]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Site web
                              </a>
                            ) : (
                              formatValue(prospect[column.name], column.type, column.name)
                            )}
                          </TableCell>
                        );
                       })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} prospects assignés
            {selectedRows.size > 0 && ` • ${selectedRows.size} sélectionné${selectedRows.size > 1 ? 's' : ''}`}
          </div>
          
          <DataPagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            pageSize={pageSize} 
            totalItems={totalCount} 
            onPageChange={setCurrentPage} 
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }} 
            loading={loading} 
          />
        </div>
      )}

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
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef} 
                        className={`space-y-2 min-h-[100px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-green-100/70 rounded-lg' : ''}`}
                      >
                        {tempColumnOrder.filter(colName => tempVisibleColumns.has(colName)).map((colName, index) => {
                          const column = availableColumns.find(col => col.name === colName);
                          if (!column) return null;
                          
                          return (
                            <Draggable key={column.name} draggableId={column.name} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  className={`flex items-center gap-2 p-2 bg-background rounded border border-green-200 hover:border-green-300 transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg scale-105 rotate-1 bg-green-50 z-50' : 'hover:shadow-md'}`}
                                >
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors duration-150">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium flex-1">{translateColumnName(column.name)}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleColumnVisibilityInDialog(column.name)} 
                                    className="h-8 w-8 p-0 hover:bg-red-100 transition-colors duration-200"
                                  >
                                    <ArrowRight className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
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
                  {availableColumns.filter(col => !tempVisibleColumns.has(col.name)).map(column => (
                    <div key={column.name} className="flex items-center justify-between p-2 bg-background rounded border border-gray-200 hover:border-gray-300 transition-colors duration-200 hover:shadow-sm">
                      <span className="text-sm flex-1 mr-2">{translateColumnName(column.name)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleColumnVisibilityInDialog(column.name)} 
                        className="h-8 w-8 p-0 hover:bg-green-100 transition-colors duration-200"
                      >
                        <ArrowLeftRight className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  ))}
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
    </div>
  );
};

export default MySalesLeads;