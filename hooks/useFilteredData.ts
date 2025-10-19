import { useState, useEffect, useCallback } from 'react';
import { getAllRecords, getDepartments, Record } from '@/lib/dexieClient';
import { ParsedRow } from '@/lib/excel';

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';
  value: string | number;
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
