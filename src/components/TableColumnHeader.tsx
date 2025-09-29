import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ArrowUp, ArrowDown, MoreHorizontal, X } from 'lucide-react';

interface TableColumnHeaderProps {
  columnName: string;
  displayName: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPinned?: boolean;
  canPin?: boolean;
  canHide?: boolean;
  onSort?: (columnName: string, order: 'asc' | 'desc') => void;
  onPin?: (columnName: string) => void;
  onHide?: (columnName: string) => void;
  onFilter?: (columnName: string, value: string) => void;
  onClearFilter?: (columnName: string) => void;
  filterValue?: string;
  className?: string;
}

const TableColumnHeader: React.FC<TableColumnHeaderProps> = ({
  columnName,
  displayName,
  sortBy,
  sortOrder,
  isPinned = false,
  canPin = true,
  canHide = true,
  onSort,
  onPin,
  onHide,
  onFilter,
  onClearFilter,
  filterValue = '',
  className = ''
}) => {
  const isSorted = sortBy === columnName;
  
  const getSortIcon = () => {
    if (!isSorted) return null;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleSort = () => {
    if (!onSort) return;
    
    if (isSorted) {
      onSort(columnName, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(columnName, 'asc');
    }
  };

  return (
    <div className={`flex items-center justify-between space-x-1 ${className}`}>
      <div 
        className="flex items-center space-x-1 cursor-pointer flex-1" 
        onClick={handleSort}
      >
        <span className="uppercase text-xs tracking-wider font-semibold">
          {displayName}
        </span>
        {getSortIcon()}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-muted/80" 
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border shadow-lg z-50" 
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenuLabel className="text-xs font-medium">
            {displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Filtrage de colonne */}
          {onFilter && (
            <>
              <div className="p-2">
                <Input 
                  placeholder={`Filtrer ${displayName}...`}
                  value={filterValue}
                  onChange={e => onFilter(columnName, e.target.value)}
                  className="h-8 text-xs"
                />
                {filterValue && onClearFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 h-6 w-full text-xs"
                    onClick={() => onClearFilter(columnName)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Options de tri */}
          {onSort && (
            <>
              <DropdownMenuCheckboxItem 
                checked={isSorted && sortOrder === 'asc'} 
                onCheckedChange={() => onSort(columnName, 'asc')}
              >
                <ArrowUp className="h-3 w-3 mr-2" />
                Trier croissant
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem 
                checked={isSorted && sortOrder === 'desc'} 
                onCheckedChange={() => onSort(columnName, 'desc')}
              >
                <ArrowDown className="h-3 w-3 mr-2" />
                Trier décroissant
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Option d'épinglage */}
          {canPin && onPin && (
            <>
              <DropdownMenuCheckboxItem 
                checked={isPinned} 
                onCheckedChange={() => onPin(columnName)}
              >
                {isPinned ? '📌 Dépingler' : '📍 Épingler à gauche'}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Option de masquage */}
          {canHide && onHide && (
            <DropdownMenuCheckboxItem 
              checked={false} 
              onCheckedChange={() => onHide(columnName)}
            >
              👁️‍🗨️ Masquer la colonne
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TableColumnHeader;