import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DataPagination from './DataPagination';

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
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [availableSections, setAvailableSections] = useState<Array<{value: string, label: string, count: number}>>([]);
  const { toast } = useToast();

  // Fonction pour filtrer les données côté client
  const filterData = (data: any[], search: string, section: string) => {
    let filtered = [...data];

    // Filtre par section
    if (tableName === 'crm_contacts' && section !== 'all') {
      filtered = filtered.filter(item => 
        item.data_section && item.data_section === section
      );
    }

    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        if (tableName === 'apollo_contacts') {
          return (
            (item.email && item.email.toLowerCase().includes(searchLower)) ||
            (item.first_name && item.first_name.toLowerCase().includes(searchLower)) ||
            (item.last_name && item.last_name.toLowerCase().includes(searchLower)) ||
            (item.company && item.company.toLowerCase().includes(searchLower))
          );
        } else if (tableName === 'crm_contacts') {
          return (
            (item.email && item.email.toLowerCase().includes(searchLower)) ||
            (item.firstname && item.firstname.toLowerCase().includes(searchLower)) ||
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.company && item.company.toLowerCase().includes(searchLower))
          );
        }
        return false;
      });
    }

    return filtered;
  };

  const fetchColumns = async () => {
    try {
      // Obtenir les colonnes depuis la première ligne de données
      const { data: firstRow } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .single();
      
      if (firstRow) {
        const columnInfo = Object.keys(firstRow).map(key => ({
          name: key,
          type: typeof firstRow[key] === 'number' ? 'number' : 'string',
          nullable: firstRow[key] === null
        }));
        setColumns(columnInfo);
      } else {
        // Fallback si pas de données
        if (tableName === 'apollo_contacts') {
          setColumns([
            { name: 'id', type: 'string', nullable: false },
            { name: 'email', type: 'string', nullable: false },
            { name: 'first_name', type: 'string', nullable: true },
            { name: 'last_name', type: 'string', nullable: true },
            { name: 'company', type: 'string', nullable: true },
          ]);
        } else {
          setColumns([
            { name: 'id', type: 'number', nullable: false },
            { name: 'email', type: 'string', nullable: false },
            { name: 'firstname', type: 'string', nullable: true },
            { name: 'name', type: 'string', nullable: true },
            { name: 'company', type: 'string', nullable: true },
          ]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des colonnes:', error);
    }
  };

  const fetchAvailableSections = async () => {
    if (tableName === 'crm_contacts') {
      try {
        const { data: sectionsData } = await supabase
          .from('crm_contacts')
          .select('data_section')
          .not('data_section', 'is', null);

        if (sectionsData) {
          // Compter les occurrences de chaque section
          const sectionCounts: { [key: string]: number } = {};
          sectionsData.forEach(item => {
            if (item.data_section) {
              sectionCounts[item.data_section] = (sectionCounts[item.data_section] || 0) + 1;
            }
          });

          // Convertir en array et trier par nombre d'occurrences
          const sections = Object.entries(sectionCounts)
            .map(([value, count]) => ({
              value,
              label: `${value} (${count.toLocaleString('fr-FR')})`,
              count
            }))
            .sort((a, b) => b.count - a.count);

          setAvailableSections(sections);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sections:', error);
      }
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let allResults: any[] = [];
      let from = 0;
      const chunkSize = 1000;
      let hasMore = true;

      // Charger toutes les données par chunks de 1000
      while (hasMore) {
        let query: any = supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .range(from, from + chunkSize - 1);

        const { data: result, error, count } = await query;

        if (error) {
          throw error;
        }

        if (result) {
          allResults = [...allResults, ...result];
        }

        // Vérifier s'il y a encore des données à charger
        hasMore = result && result.length === chunkSize;
        from += chunkSize;

        // Pour éviter les boucles infinies, arrêter si on dépasse le count total
        if (count && allResults.length >= count) {
          hasMore = false;
        }
      }

      setAllData(allResults);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour appliquer les filtres et la pagination
  const applyFiltersAndPagination = () => {
    const filtered = filterData(allData, searchTerm, sectionFilter);
    setFilteredData(filtered);
  };

  // Obtenir les données paginées
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
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

  // Appliquer les filtres à chaque changement
  useEffect(() => {
    applyFiltersAndPagination();
  }, [allData, searchTerm, sectionFilter]);

  useEffect(() => {
    fetchColumns();
    fetchAvailableSections();
    fetchAllData();
  }, [tableName]);

  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Oui' : 'Non'}</Badge>;
    }
    
    if (columnName.includes('date') || columnName.includes('_at')) {
      try {
        const date = new Date(value);
        return date.toLocaleString('fr-FR');
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }
    
    return value;
  };

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const tableTitle = tableName === 'apollo_contacts' ? 'Contacts Apollo' : 'Contacts CRM';
  const paginatedData = getPaginatedData();

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
              {filteredData.length.toLocaleString('fr-FR')} enregistrement(s) 
              {filteredData.length !== allData.length && ` sur ${allData.length.toLocaleString('fr-FR')} au total`}
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
          {tableName === 'crm_contacts' && availableSections.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => handleSectionFilterChange(e.target.value)}
                className="px-3 py-1 border border-input rounded-md text-sm bg-background min-w-[200px]"
              >
                <option value="all">Toutes ({allData.length.toLocaleString('fr-FR')})</option>
                {availableSections.map((section) => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Données de la table</CardTitle>
          <CardDescription>
            Page {currentPage} sur {totalPages} ({pageSize} éléments par page)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des données...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.slice(0, 8).map((column) => (
                        <TableHead key={column.name} className="font-medium">
                          {column.name}
                        </TableHead>
                      ))}
                      {columns.length > 8 && (
                        <TableHead className="font-medium">
                          +{columns.length - 8} colonnes...
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow key={index}>
                        {columns.slice(0, 8).map((column) => (
                          <TableCell key={column.name} className="max-w-[200px]">
                            {formatCellValue(row[column.name], column.name)}
                          </TableCell>
                        ))}
                        {columns.length > 8 && (
                          <TableCell className="text-muted-foreground">
                            <Button variant="outline" size="sm">
                              Voir plus
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredData.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TableView;