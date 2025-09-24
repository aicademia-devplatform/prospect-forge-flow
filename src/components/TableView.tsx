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
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'arlynk' | 'aicademia'>('all');
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const { toast } = useToast();

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

  const fetchData = async (page: number, size: number, search: string = '', isInfinite: boolean = false) => {
    if (isInfinite) {
      setInfiniteLoading(true);
    } else {
      setLoading(true);
    }

    try {
      let query = supabase.from(tableName).select('*', { count: 'exact' });

      // Appliquer le filtre de section pour CRM contacts
      if (tableName === 'crm_contacts' && sectionFilter !== 'all') {
        const sectionValue = sectionFilter === 'arlynk' ? 'Arlynk' : 'Aicademia';
        query = query.eq('data_section', sectionValue);
      }

      // Recherche simple sur les colonnes texte principales
      if (search) {
        if (tableName === 'apollo_contacts') {
          query = query.or('email.ilike.%' + search + '%,first_name.ilike.%' + search + '%,last_name.ilike.%' + search + '%,company.ilike.%' + search + '%');
        } else if (tableName === 'crm_contacts') {
          query = query.or('email.ilike.%' + search + '%,firstname.ilike.%' + search + '%,name.ilike.%' + search + '%,company.ilike.%' + search + '%');
        }
      }

      const from = (page - 1) * size;
      const to = from + size - 1;

      if (size !== 1000) {
        query = query.range(from, to);
      } else {
        // Pour le mode infini, charger les premières 1000 entrées d'abord
        query = query.range(0, 999);
      }

      const { data: result, error, count } = await query;

      if (error) {
        throw error;
      }

      if (isInfinite) {
        setData(prev => [...prev, ...(result || [])]);
      } else {
        setData(result || []);
      }
      
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données."
      });
    } finally {
      setLoading(false);
      setInfiniteLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, pageSize, searchTerm);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    
    if (size === 1000) {
      // Pour 1000 éléments, charger la première page et préparer le scroll infini
      fetchData(1, size, searchTerm);
    } else {
      fetchData(1, size, searchTerm);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchData(1, pageSize, value);
  };

  const handleSectionFilterChange = (value: 'all' | 'arlynk' | 'aicademia') => {
    setSectionFilter(value);
    setCurrentPage(1);
    fetchData(1, pageSize, searchTerm);
  };

  const handleInfiniteScroll = () => {
    if (pageSize === 1000 && !infiniteLoading && data.length < totalCount) {
      const nextPage = Math.floor(data.length / 1000) + 2;
      fetchData(nextPage, 1000, searchTerm, true);
    }
  };

  useEffect(() => {
    fetchColumns();
    fetchData(1, pageSize, searchTerm);
  }, [tableName, pageSize, sectionFilter]);

  // Gérer le scroll infini pour pageSize = 1000
  useEffect(() => {
    if (pageSize === 1000) {
      const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return;
        handleInfiniteScroll();
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [pageSize, infiniteLoading, data.length, totalCount, searchTerm]);

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

  const totalPages = Math.ceil(totalCount / pageSize);
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
          {tableName === 'crm_contacts' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => handleSectionFilterChange(e.target.value as 'all' | 'arlynk' | 'aicademia')}
                className="px-3 py-1 border border-input rounded-md text-sm bg-background"
              >
                <option value="all">Toutes</option>
                <option value="arlynk">Arlynk</option>
                <option value="aicademia">Aicademia</option>
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
            {pageSize === 1000 ? 
              `Affichage avec scroll infini (${data.length} éléments chargés)` :
              `Page ${currentPage} sur ${totalPages} (${pageSize} éléments par page)`
            }
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
                    {data.map((row, index) => (
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

              {pageSize !== 1000 && (
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}

              {pageSize === 1000 && infiniteLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement des données suivantes...</span>
                </div>
              )}

              {pageSize === 1000 && !infiniteLoading && data.length >= totalCount && totalCount > 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Tous les enregistrements ont été chargés
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TableView;