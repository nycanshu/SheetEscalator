import { useState, useEffect, useCallback } from 'react';
import { getAllRecords, getDepartments, Record } from '@/lib/dexieClient';

export interface UsePendingDataReturn {
  records: Record[];
  departments: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePendingData(): UsePendingDataReturn {
  const [records, setRecords] = useState<Record[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [recordsData, departmentsData] = await Promise.all([
        getAllRecords(),
        getDepartments()
      ]);
      
      setRecords(recordsData);
      setDepartments(departmentsData);
    } catch (err) {
      console.error('Error fetching pending data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    records,
    departments,
    loading,
    error,
    refresh
  };
}
