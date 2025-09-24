import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Download, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ExternalLink, MoreHorizontal, X, ChevronDown } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch data using server-side pagination
  const { data, totalCount, totalPages, loading } = useTableData({
    tableName,
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    sectionFilter: selectedSections.length > 0 ? selectedSections.join(',') : 'all',
    sortBy,
    sortOrder
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
    const colors = [
      'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-300',
      'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300',
      'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300',
      'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-300',
      'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-300',
      'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-teal-300',
      'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-300',
      'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300',
      'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-300',
      'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-300',
      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-300',
      'bg-gradient-to-r from-violet-500 to-violet-600 text-white border-violet-300'
    ];
    
    // Normalize the section name (case-insensitive, handle ARlynk/Arlynk)
    const normalizedName = sectionName.toLowerCase().trim();
    // Normalize all variations of arlynk to the same value
    const finalName = normalizedName === 'arlynk' || normalizedName === 'arlynk' ? 'arlynk' : normalizedName;
    
    // Use string hash to consistently assign same color to same section
    let hash = 0;
    for (let i = 0; i < finalName.length; i++) {
      const char = finalName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
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

  // Define columns based on table
  const getColumns = (): ColumnInfo[] => {
    if (tableName === 'apollo_contacts') {
      return [
        { name: 'id', type: 'string', nullable: false },
        { name: 'email', type: 'string', nullable: false },
        { name: 'first_name', type: 'string', nullable: true },
        { name: 'last_name', type: 'string', nullable: true },
        { name: 'company', type: 'string', nullable: true },
        { name: 'title', type: 'string', nullable: true },
        { name: 'created_at', type: 'string', nullable: true },
        { name: 'updated_at', type: 'string', nullable: true },
      ];
    } else {
      return [
        { name: 'id', type: 'number', nullable: false },
        { name: 'email', type: 'string', nullable: false },
        { name: 'firstname', type: 'string', nullable: true },
        { name: 'name', type: 'string', nullable: true },
        { name: 'company', type: 'string', nullable: true },
        { name: 'data_section', type: 'string', nullable: true },
        { name: 'created_at', type: 'string', nullable: true },
        { name: 'updated_at', type: 'string', nullable: true },
      ];
    }
  };

  const columns = getColumns();

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
            <div className="flex items-center space-x-2">
              {sections.map((section) => {
                const isSelected = selectedSections.includes(section.value);
                const colorClass = isSelected 
                  ? generateSectionColor(section.label) 
                  : 'bg-muted text-muted-foreground border-muted';
                
                return (
                  <span
                    key={section.value}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 border ${colorClass}`}
                    onClick={() => toggleSection(section.value)}
                  >
                    {section.value}
                  </span>
                );
              })}
            </div>
          )}
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

            <div className="overflow-x-auto">
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
                    {columns.slice(0, 7).map((column) => (
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
                        {columns.slice(0, 7).map((column) => (
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