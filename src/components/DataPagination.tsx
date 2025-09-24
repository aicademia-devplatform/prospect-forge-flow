import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}
const DataPagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  loading = false
}: DataPaginationProps) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  return <div className="flex items-center justify-between px-2 py-[4px]">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Lignes par page</p>
          <Select value={pageSize.toString()} onValueChange={value => onPageSizeChange(Number(value))} disabled={loading}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {totalItems > 0 ? <>
              {startItem}-{endItem} sur {totalItems.toLocaleString('fr-FR')}
            </> : 'Aucun élément'}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => onPageChange(1)} disabled={currentPage === 1 || loading}>
            <span className="sr-only">Aller à la première page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>
            <span className="sr-only">Aller à la page précédente</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>
            <span className="sr-only">Aller à la page suivante</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || loading}>
            <span className="sr-only">Aller à la dernière page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
};
export default DataPagination;