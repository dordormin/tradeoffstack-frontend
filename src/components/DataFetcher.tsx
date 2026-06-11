import React, { useState, useEffect, useCallback } from 'react';

interface DataFetcherState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface DataFetcherProps<T> {
  fetchFn: () => Promise<T>;
  children: (state: DataFetcherState<T>) => React.ReactNode;
}

export function DataFetcher<T>({ fetchFn, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return <>{children({ data, loading, error, refetch: loadData })}</>;
}
