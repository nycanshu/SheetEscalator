import { useState, useEffect, useCallback } from 'react';
import { getAllRecords, getDepartments, Record } from '@/lib/dexieClient';
import { ParsedRow } from '@/lib/excel';

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'column_equals' | 'column_greater_than' | 'column_less_than' | 'column_greater_equal' | 'column_less_equal';
  value: string | number;
  compareColumn?: string; // For column-to-column comparisons
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface UseFilteredDataReturn {
  records: Record[];
  departments: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  appliedFilters: FilterGroup[] | null;
  totalRecords: number;
  filteredCount: number;
}

export function useFilteredData(): UseFilteredDataReturn {
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<FilterGroup[] | null>(null);
  const [lastFilterTimestamp, setLastFilterTimestamp] = useState<string | null>(null);

  const applyFilters = useCallback((records: Record[], filters: FilterGroup[]): Record[] => {
    if (!filters || filters.length === 0) {
      return records;
    }

    return records.filter(record => {
      return filters.every(group => {
        if (group.conditions.length === 0) return true;

        const groupResults = group.conditions.map(condition => {
          const recordValue = record[condition.column as keyof Record];
          const filterValue = condition.value;

          // Handle column-to-column comparisons
          if (condition.operator.startsWith('column_') && condition.compareColumn) {
            const compareValue = record[condition.compareColumn as keyof Record];
            let leftValue = Number(recordValue);
            let rightValue = Number(compareValue);

            switch (condition.operator) {
              case 'column_equals':
                return leftValue === rightValue;
              case 'column_greater_than':
                return leftValue > rightValue;
              case 'column_less_than':
                return leftValue < rightValue;
              case 'column_greater_equal':
                return leftValue >= rightValue;
              case 'column_less_equal':
                return leftValue <= rightValue;
              default:
                return true;
            }
          }

          // Handle regular value comparisons
          switch (condition.operator) {
            case 'equals':
              if (typeof recordValue === 'boolean') {
                return recordValue === (String(filterValue) === 'true');
              }
              return String(recordValue).toLowerCase() === String(filterValue).toLowerCase();
            case 'contains':
              return String(recordValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'greater_than':
              return Number(recordValue) > Number(filterValue);
            case 'less_than':
              return Number(recordValue) < Number(filterValue);
            case 'greater_equal':
              return Number(recordValue) >= Number(filterValue);
            case 'less_equal':
              return Number(recordValue) <= Number(filterValue);
            default:
              return true;
          }
        });

        return group.logic === 'AND' 
          ? groupResults.every(result => result)
          : groupResults.some(result => result);
      });
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [recordsData, departmentsData] = await Promise.all([
        getAllRecords(),
        getDepartments()
      ]);
      
      setAllRecords(recordsData);
      setDepartments(departmentsData);

      // Check if there are applied filters in localStorage
      const storedFilters = localStorage.getItem('appliedFilters');
      const filterTimestamp = localStorage.getItem('filterTimestamp');
      
      // Check if filters have been updated
      const filtersChanged = filterTimestamp !== lastFilterTimestamp;
      if (filtersChanged) {
        setLastFilterTimestamp(filterTimestamp);
      }
      
      if (storedFilters) {
        try {
          const filters: FilterGroup[] = JSON.parse(storedFilters);
          setAppliedFilters(filters);
          const filtered = applyFilters(recordsData, filters);
          setFilteredRecords(filtered);
        } catch (error) {
          console.error('Error parsing stored filters:', error);
          setFilteredRecords(recordsData);
        }
      } else {
        setAppliedFilters(null);
        setFilteredRecords(recordsData);
      }
    } catch (err) {
      console.error('Error fetching filtered data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [applyFilters]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for localStorage changes and custom events to refresh data when filters are updated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appliedFilters' || e.key === 'filterTimestamp') {
        fetchData();
      }
    };

    const handleFiltersUpdated = () => {
      fetchData();
    };

    // Also listen for page visibility change to refresh when user comes back to dashboard
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('filtersUpdated', handleFiltersUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('filtersUpdated', handleFiltersUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  return {
    records: filteredRecords,
    departments,
    loading,
    error,
    refresh,
    appliedFilters,
    totalRecords: allRecords.length,
    filteredCount: filteredRecords.length
  };
}
