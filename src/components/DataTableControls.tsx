import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortConfig } from '@/hooks/useTableState';

interface DataTableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  isFr?: boolean;
  children?: React.ReactNode;
}

export const DataTableControls: React.FC<DataTableControlsProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  isFr = false,
  children,
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || (isFr ? 'Rechercher...' : 'Search...')}
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto items-center">
          {children}
        </div>
      </div>
    </>
  );
};

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isFr?: boolean;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isFr = false,
}) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalFiltered);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card/50">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {totalFiltered > 0
            ? `${start}–${end} ${isFr ? 'sur' : 'of'} ${totalFiltered}`
            : (isFr ? '0 résultat' : '0 results')}
        </span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <span>{isFr ? 'Afficher' : 'Show'}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-1.5 py-0.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {[5, 10, 20, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>{isFr ? 'lignes' : 'rows'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page: number;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          return (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-xs cursor-pointer ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = '',
}) => {
  const isActive = sortConfig.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer select-none ${className}`}
    >
      {label}
      {isActive && sortConfig.direction === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-primary" />
      ) : isActive && sortConfig.direction === 'desc' ? (
        <ArrowDown className="w-3.5 h-3.5 text-primary" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
};
