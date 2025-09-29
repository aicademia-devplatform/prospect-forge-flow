import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TableColumnHeader from './TableColumnHeader';

// Exemple d'utilisation du composant TableColumnHeader dans un tableau simple
interface SimpleTableData {
  id: string;
  name: string;
  email: string;
  company: string;
  date: string;
}

interface SimpleTableExampleProps {
  data: SimpleTableData[];
}

const SimpleTableExample: React.FC<SimpleTableExampleProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set(['email']));
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['name', 'email', 'company', 'date']));
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Fonctions de gestion des colonnes
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
  };

  const toggleColumnPin = (columnName: string) => {
    setPinnedColumns(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(columnName)) {
        // Si la colonne est déjà épinglée, la dépingler
        newPinned.delete(columnName);
      } else {
        // Dépingler toutes les autres colonnes sauf 'email' qui reste toujours épinglée
        newPinned.clear();
        newPinned.add('email'); // Toujours garder email épinglé
        // Épingler la nouvelle colonne seulement si ce n'est pas 'email'
        if (columnName !== 'email') {
          newPinned.add(columnName);
        }
      }
      return newPinned;
    });
  };

  const hideColumn = (columnName: string) => {
    const newVisible = new Set(visibleColumns);
    newVisible.delete(columnName);
    setVisibleColumns(newVisible);
  };

  const handleColumnFilter = (columnName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const clearColumnFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
  };

  // Filtrer et trier les données
  const processedData = data
    .filter(item => {
      return Object.entries(columnFilters).every(([columnName, filterValue]) => {
        if (!filterValue) return true;
        const value = item[columnName as keyof SimpleTableData] || '';
        return value.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof SimpleTableData] || '';
      const bValue = b[sortBy as keyof SimpleTableData] || '';
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  // Configuration des colonnes
  const columns = [
    { key: 'name', label: 'Nom', canHide: true },
    { key: 'email', label: 'Email', canHide: false },
    { key: 'company', label: 'Entreprise', canHide: true },
    { key: 'date', label: 'Date', canHide: true }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemple de tableau avec headers avancés</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => 
                visibleColumns.has(column.key) && (
                  <TableHead 
                    key={column.key}
                    className={`px-4 py-4 text-left min-w-[120px] ${
                      pinnedColumns.has(column.key) 
                        ? 'sticky left-0 z-30 bg-primary/5 backdrop-blur-sm font-semibold text-primary' 
                        : 'z-20 bg-table-header font-semibold text-muted-foreground'
                    }`}
                  >
                    <TableColumnHeader
                      columnName={column.key}
                      displayName={column.label}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      isPinned={pinnedColumns.has(column.key)}
                      canPin={true}
                      canHide={column.canHide}
                      onSort={handleSort}
                      onPin={toggleColumnPin}
                      onHide={hideColumn}
                      onFilter={handleColumnFilter}
                      onClearFilter={clearColumnFilter}
                      filterValue={columnFilters[column.key] || ''}
                    />
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((item) => (
              <TableRow key={item.id}>
                {columns.map(column => 
                  visibleColumns.has(column.key) && (
                    <TableCell 
                      key={column.key}
                      className={`px-4 py-4 ${
                        pinnedColumns.has(column.key) 
                          ? 'sticky left-0 z-10 bg-primary/5 backdrop-blur-sm font-semibold text-primary' 
                          : ''
                      }`}
                    >
                      {item[column.key as keyof SimpleTableData]}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SimpleTableExample;