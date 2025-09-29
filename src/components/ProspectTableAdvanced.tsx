import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Download, Loader2, ArrowUpDown, ArrowUp, ArrowDown, 
  MoreHorizontal, X, ChevronDown, Settings, Columns, UserPlus,
  Eye, EyeOff, Filter, Phone, Mail, Building, User, ExternalLink
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataPagination from './DataPagination';
import { useProspectData } from '@/hooks/useProspectData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProspectTableAdvancedProps {
  showTitle?: boolean;
}

interface ColumnInfo {
  name: string;
  label: string;
  type: string;
  sortable: boolean;
  visible: boolean;
}

// Column definitions for prospects
const DEFAULT_COLUMNS: ColumnInfo[] = [
  { name: 'name', label: 'Nom', type: 'string', sortable: true, visible: true },
  { name: 'email', label: 'Email', type: 'string', sortable: true, visible: true },
  { name: 'company', label: 'Entreprise', type: 'string', sortable: true, visible: true },
  { name: 'title', label: 'Titre', type: 'string', sortable: true, visible: true },
  { name: 'phone', label: 'Téléphone', type: 'string', sortable: false, visible: false },
  { name: 'status', label: 'Statut', type: 'string', sortable: true, visible: true },
  { name: 'source', label: 'Source', type: 'string', sortable: true, visible: true },
  { name: 'industry', label: 'Industrie', type: 'string', sortable: true, visible: false },
  { name: 'seniority', label: 'Séniorité', type: 'string', sortable: true, visible: false },
  { name: 'last_contacted', label: 'Dernier contact', type: 'date', sortable: true, visible: true },
  { name: 'assigned_at', label: 'Assigné le', type: 'date', sortable: true, visible: true },
];

const STATUS_COLORS = {
  'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'qualified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  'replied': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'bounced': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const ProspectTableAdvanced: React.FC<ProspectTableAdvancedProps> = ({ 
  showTitle = true 
}) => {
  const { userRole } = useAuth();
  const { toast } = useToast();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('assigned_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEFAULT_COLUMNS.filter(col => col.visible).map(col => col.name))
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchColumns] = useState(['name', 'email', 'company']);

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch data
  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);
  
  const {
    data,
    totalCount,
    totalPages,
    loading,
    refetch
  } = useProspectData({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    searchColumns,
    sortBy,
    sortOrder,
    visibleColumns: visibleColumnsArray,
    statusFilter,
    sourceFilter
  });

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach(item => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses);
  }, [data]);

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    data.forEach(item => {
      if (item.source) sources.add(item.source);
    });
    return Array.from(sources);
  }, [data]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

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

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  const formatValue = (value: any, type: string) => {
    if (!value) return '-';
    
    if (type === 'date') {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    return value.toString();
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadgeClass = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.new;
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Prospects Assignés</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Assigner des prospects
            </Button>
          </div>
        </div>
      )}

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 mr-2" />
                    Colonnes
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DEFAULT_COLUMNS.map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.name}
                      checked={visibleColumns.has(column.name)}
                      onCheckedChange={() => toggleColumnVisibility(column.name)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Selection info */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedRows.size} sélectionné{selectedRows.size > 1 ? 's' : ''}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRows(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div ref={tableContainerRef} className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && selectedRows.size === data.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Sélectionner tous"
                  />
                </TableHead>
                {DEFAULT_COLUMNS.map(column => 
                  visibleColumns.has(column.name) && (
                    <TableHead 
                      key={column.name}
                      className={`${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      onClick={column.sortable ? () => handleSort(column.name) : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.label}</span>
                        {column.sortable && renderSortIcon(column.name)}
                      </div>
                    </TableHead>
                  )
                )}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell 
                    colSpan={Array.from(visibleColumns).length + 2} 
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement des prospects...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={Array.from(visibleColumns).length + 2} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun prospect trouvé
                  </TableCell>
                </TableRow>
              ) : (
                data.map((prospect) => (
                  <TableRow
                    key={prospect.id}
                    className={selectedRows.has(prospect.id) ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(prospect.id)}
                        onCheckedChange={() => handleRowSelect(prospect.id)}
                        aria-label={`Sélectionner ${prospect.name}`}
                      />
                    </TableCell>

                    {visibleColumns.has('name') && (
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {prospect.name}
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has('email') && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${prospect.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {prospect.email}
                          </a>
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has('company') && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {prospect.company}
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.has('title') && (
                      <TableCell className="text-muted-foreground">
                        {prospect.title}
                      </TableCell>
                    )}

                    {visibleColumns.has('phone') && (
                      <TableCell>
                        {prospect.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`tel:${prospect.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {prospect.phone}
                            </a>
                          </div>
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.has('status') && (
                      <TableCell>
                        <Badge className={getStatusBadgeClass(prospect.status)}>
                          {prospect.status}
                        </Badge>
                      </TableCell>
                    )}

                    {visibleColumns.has('source') && (
                      <TableCell>
                        <Badge variant="outline">{prospect.source}</Badge>
                      </TableCell>
                    )}

                    {visibleColumns.has('industry') && (
                      <TableCell>{prospect.industry}</TableCell>
                    )}

                    {visibleColumns.has('seniority') && (
                      <TableCell>{prospect.seniority}</TableCell>
                    )}

                    {visibleColumns.has('last_contacted') && (
                      <TableCell>
                        {formatValue(prospect.last_contacted, 'date')}
                      </TableCell>
                    )}

                    {visibleColumns.has('assigned_at') && (
                      <TableCell>
                        {formatValue(prospect.assigned_at, 'date')}
                      </TableCell>
                    )}

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          {prospect.linkedin_url && (
                            <DropdownMenuItem asChild>
                              <a 
                                href={prospect.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                LinkedIn
                              </a>
                            </DropdownMenuItem>
                          )}
                          {prospect.website && (
                            <DropdownMenuItem asChild>
                              <a 
                                href={prospect.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Site web
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Retirer l'assignation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} prospects
            {selectedRows.size > 0 && ` • ${selectedRows.size} sélectionné${selectedRows.size > 1 ? 's' : ''}`}
          </div>
          
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};