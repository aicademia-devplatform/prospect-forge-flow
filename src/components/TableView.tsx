import React, { useState, useEffect, useCallback } from 'react';
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

const TableView = ({ tableName, onBack }: TableViewProps) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const { toast } = useToast();

  const fetchColumns = useCallback(async () => {
    try {
      // Obtenir les colonnes depuis la première ligne de données
      const { data: firstRow } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .single();
      
      if (firstRow) {
        const cols = Object.keys(firstRow).map(key => ({
          name: key,
          type: typeof firstRow[key],
          nullable: true
        }));
        setColumns(cols);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des colonnes:', error);
      // Colonnes par défaut selon la table
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
  }, [tableName]);

  const fetchData = useCallback(async (page: number, size: number, search: string = '', isInfinite: boolean = false) => {
    if (isInfinite) {
      setInfiniteLoading(true);
    } else {
      setLoading(true);
    }

    try {
      let query = supabase.from(tableName).select('*', { count: 'exact' });

      // Recherche simple sur les colonnes texte principales
      if (search) {
        if (tableName === 'apollo_contacts') {
          query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`);
        } else if (tableName === 'crm_contacts') {
          query = query.or(`email.ilike.%${search}%,firstname.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
        }
      }

      const from = (page - 1) * size;
      const to = from + size - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: tableData, error, count } = await query;

      if (error) throw error;

      if (isInfinite && page > 1) {
        setData(prev => [...prev, ...(tableData || [])]);
      } else {
        setData(tableData || []);
      }
      
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données de la table."
      });
    } finally {
      setLoading(false);
      setInfiniteLoading(false);
    }
  }, [tableName, toast]);

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

  const handleInfiniteScroll = useCallback(() => {
    if (pageSize === 1000 && !infiniteLoading && data.length < totalCount) {
      const nextPage = Math.floor(data.length / 1000) + 2;
      fetchData(nextPage, 1000, searchTerm, true);
    }
  }, [pageSize, infiniteLoading, data.length, totalCount, searchTerm, fetchData]);

  useEffect(() => {
    fetchColumns();
    fetchData(1, pageSize);
  }, [fetchColumns, fetchData, pageSize]);

  useEffect(() => {
    if (pageSize === 1000) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
          handleInfiniteScroll();
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [pageSize, handleInfiniteScroll]);

  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Oui' : 'Non'}</Badge>;
    }
    
    if (columnName.includes('date') || columnName.includes('_at')) {
      try {
        return new Date(value).toLocaleString('fr-FR');
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
        
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
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
            Visualisation des données avec pagination {pageSize === 1000 ? 'et scroll infini' : 'standard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des données...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.slice(0, 8).map((column) => (
                        <TableHead key={column.name} className="whitespace-nowrap">
                          {column.name}
                        </TableHead>
                      ))}
                      {columns.length > 8 && (
                        <TableHead>...</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={row.id || index}>
                        {columns.slice(0, 8).map((column) => (
                          <TableCell key={column.name} className="max-w-[200px]">
                            {formatCellValue(row[column.name], column.name)}
                          </TableCell>
                        ))}
                        {columns.length > 8 && (
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Voir plus
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {infiniteLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement de plus de données...</span>
                </div>
              )}

              {pageSize !== 1000 && (
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  loading={loading}
                />
              )}

              {pageSize === 1000 && (
                <div className="mt-4 text-center">
                  <DataPagination
                    currentPage={1}
                    totalPages={1}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    onPageChange={() => {}}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Mode scroll infini activé - {data.length} sur {totalCount} éléments chargés
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TableView;