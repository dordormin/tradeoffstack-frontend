import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface UseTableStateOptions<T> {
  data: T[];
  initialPageSize?: number;
  searchableKeys?: (keyof T)[];
}

export function useTableState<T extends Record<string, any>>({
  data,
  initialPageSize = 10,
  searchableKeys = [],
}: UseTableStateOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      searchableKeys.some(key => {
        const val = item[key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, searchableKeys]);

  const sorted = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      // Try numeric comparison
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Date comparison
      const aDate = Date.parse(aStr);
      const bDate = Date.parse(bStr);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // String comparison
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safeCurrentPage, pageSize]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    searchTerm,
    setSearchTerm: (v: string) => { setSearchTerm(v); setCurrentPage(1); },
    sortConfig,
    handleSort,
    currentPage: safeCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalFiltered: sorted.length,
    paginatedData: paginated,
  };
}
