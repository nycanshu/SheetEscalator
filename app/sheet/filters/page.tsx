'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  BarChart3, 
  FileText, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllRecords, Record } from '@/lib/dexieClient';
import toast from 'react-hot-toast';

interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'column_equals' | 'column_greater_than' | 'column_less_than' | 'column_greater_equal' | 'column_less_equal';
  value: string | number;
  compareColumn?: string; // For column-to-column comparisons
}

interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

const AVAILABLE_COLUMNS = [
  { key: 'department', label: 'Department', type: 'string' },
  { key: 'fileActivity', label: 'File/Activity', type: 'string' },
  { key: 'currentLevel', label: 'Current Level', type: 'string' },
  { key: 'pendingSince', label: 'Pending Since (Days)', type: 'number' },
  { key: 'tatDays', label: 'TAT (Days)', type: 'number' },
  { key: 'nextLevel', label: 'Next Level', type: 'string' },
  { key: 'escalationEmail', label: 'Escalation Authority Email', type: 'string' },
  { key: 'remarks', label: 'Remarks', type: 'string' },
  { key: 'mailSent', label: 'Mail Sent Status', type: 'boolean' }
];

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_equal', label: 'Greater than or equal' },
    { value: 'less_equal', label: 'Less than or equal' },
    { value: 'column_equals', label: 'Equals Column' },
    { value: 'column_greater_than', label: 'Greater than Column' },
    { value: 'column_less_than', label: 'Less than Column' },
    { value: 'column_greater_equal', label: 'Greater than or equal Column' },
    { value: 'column_less_equal', label: 'Less than or equal Column' }
  ],
  boolean: [
    { value: 'equals', label: 'Equals' }
  ]
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function FilterPage() {
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const router = useRouter();

  const getDefaultValueForColumn = (columnKey: string) => {
    const columnType = getColumnType(columnKey);
    switch (columnType) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return 'false';
      default:
        return '';
    }
  };

  const getDefaultOperatorForColumn = (columnKey: string) => {
    const columnType = getColumnType(columnKey);
    switch (columnType) {
      case 'string':
        return 'contains';
      case 'number':
        return 'greater_than';
      case 'boolean':
        return 'equals';
      default:
        return 'contains';
    }
  };

  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  useEffect(() => {
    loadRecords();
    loadSavedFilters();
  }, []);

  const loadSavedFilters = () => {
    try {
      const savedFilters = localStorage.getItem('appliedFilters');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        setFilterGroups(parsedFilters);
        setFiltersLoaded(true);
      } else {
        // Only use default filter if no saved filters exist
        setFilterGroups([
          {
            id: '1',
            conditions: [{ 
              column: 'pendingSince', 
              operator: 'column_greater_equal' as const, 
              value: 0, 
              compareColumn: 'tatDays' 
            }],
            logic: 'AND' as const
          }
        ]);
        setFiltersLoaded(false);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
      // Fallback to default filter if there's an error
      setFilterGroups([
        {
          id: '1',
          conditions: [{ 
            column: 'pendingSince', 
            operator: 'column_greater_equal' as const, 
            value: 0, 
            compareColumn: 'tatDays' 
          }],
          logic: 'AND' as const
        }
      ]);
      setFiltersLoaded(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const records = await getAllRecords();
      setAllRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (allRecords.length === 0) return [];

    return allRecords.filter(record => {
      return filterGroups.every(group => {
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
  }, [allRecords, filterGroups]);

  // Update localStorage with current filtered count when filters change
  useEffect(() => {
    if (allRecords.length > 0 && filterGroups.length > 0) {
      localStorage.setItem('filteredRecordCount', filteredRecords.length.toString());
    }
  }, [filteredRecords.length, allRecords.length, filterGroups.length]);

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      conditions: [{ column: 'department', operator: 'contains', value: '' }],
      logic: 'AND'
    };
    setFilterGroups([...filterGroups, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {
      setFilterGroups(filterGroups.filter(group => group.id !== groupId));
    }
  };

  const addCondition = (groupId: string) => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              conditions: [...group.conditions, { 
                column: 'department', 
                operator: getDefaultOperatorForColumn('department'), 
                value: getDefaultValueForColumn('department'),
                compareColumn: undefined
              }] 
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionIndex: number) => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { ...group, conditions: group.conditions.filter((_, index) => index !== conditionIndex) }
          : group
      )
    );
  };

  const updateCondition = (groupId: string, conditionIndex: number, field: keyof FilterCondition, value: any) => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              conditions: group.conditions.map((condition, index) => {
                if (index === conditionIndex) {
                  const updatedCondition = { ...condition, [field]: value };
                  
                  // If column changes, reset operator and value to appropriate defaults
                  if (field === 'column') {
                    updatedCondition.operator = getDefaultOperatorForColumn(value);
                    updatedCondition.value = getDefaultValueForColumn(value);
                    // Clear column-specific fields
                    updatedCondition.compareColumn = undefined;
                  }
                  
                  return updatedCondition;
                }
                return condition;
              })
            }
          : group
      )
    );
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setFilterGroups(groups => 
      groups.map(group => 
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  const applyFiltersToStorage = () => {
    // Store filtered records in a way that dashboard can access them
    localStorage.setItem('appliedFilters', JSON.stringify(filterGroups));
    localStorage.setItem('filteredRecordCount', filteredRecords.length.toString());
    localStorage.setItem('filterTimestamp', Date.now().toString());
    
    // Mark filters as loaded/saved
    setFiltersLoaded(true);
    
    // Dispatch custom event to notify dashboard of filter changes
    window.dispatchEvent(new CustomEvent('filtersUpdated'));
  };

  const handleApplyFilters = async () => {
    setApplyingFilters(true);
    try {
      applyFiltersToStorage();
      toast.success(`Applied filters! Found ${filteredRecords.length} matching records.`);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setApplyingFilters(false);
    }
  };

  const handleContinue = async () => {
    setApplyingFilters(true);
    try {
      // Apply filters first, then navigate
      applyFiltersToStorage();
      toast.success(`Applied filters! Found ${filteredRecords.length} matching records.`);
      
      // Small delay to ensure localStorage is updated before navigation
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
      setApplyingFilters(false);
    }
  };

  const handleResetFilters = () => {
    const defaultFilter: FilterGroup[] = [
      {
        id: '1',
        conditions: [{ 
          column: 'pendingSince', 
          operator: 'column_greater_equal' as const, 
          value: 0, 
          compareColumn: 'tatDays' 
        }],
        logic: 'AND' as const
      }
    ];
    
    setFilterGroups(defaultFilter);
    setFiltersLoaded(false);
    
    // Also update localStorage with the default filter
    localStorage.setItem('appliedFilters', JSON.stringify(defaultFilter));
    localStorage.setItem('filteredRecordCount', '0'); // Will be updated by the filteredRecords calculation
    localStorage.setItem('filterTimestamp', Date.now().toString());
    
    // Dispatch event to notify dashboard
    window.dispatchEvent(new CustomEvent('filtersUpdated'));
    
    setShowResetModal(false);
    toast.success('Filters reset to default');
  };

  const getColumnType = (columnKey: string) => {
    const column = AVAILABLE_COLUMNS.find(col => col.key === columnKey);
    return column?.type || 'string';
  };

  const getColumnLabel = (columnKey: string) => {
    const column = AVAILABLE_COLUMNS.find(col => col.key === columnKey);
    return column?.label || columnKey;
  };

  const formatFilterCondition = (condition: FilterCondition) => {
    const columnLabel = getColumnLabel(condition.column);
    
    if (condition.operator.startsWith('column_')) {
      const compareLabel = getColumnLabel(condition.compareColumn || '');
      const operatorLabel = condition.operator.replace('column_', '').replace('_', ' ');
      
      return `${columnLabel} ${operatorLabel} ${compareLabel}`;
    } else {
      const operatorLabel = condition.operator.replace('_', ' ');
      return `${columnLabel} ${operatorLabel} ${condition.value}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading records...</p>
        </motion.div>
      </div>
    );
  }

  if (allRecords.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
          <p className="text-muted-foreground mb-6">
            Please upload an Excel file first to configure filters.
          </p>
          <Button asChild>
            <a href="/">Upload File</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configure Filters</h1>
                <p className="text-muted-foreground">
                  Set up filters to view specific records from your uploaded data
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Total Records: {allRecords.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Filtered Records: {filteredRecords.length}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-between items-center">
              {/* Back button on left */}
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {/* Apply filters and Continue buttons on right */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Reset button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetModal(true)}
                  className="w-full sm:w-auto"
                  title="Reset filters to default"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handleApplyFilters}
                  disabled={applyingFilters}
                  className="w-full sm:w-auto"
                >
                  {applyingFilters ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Filter className="mr-2 h-4 w-4" />
                      Apply Filters
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleContinue}
                  disabled={filteredRecords.length === 0 || applyingFilters}
                  className="w-full sm:w-auto"
                >
                  {applyingFilters ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Continue to Dashboard
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Filter Configuration */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Conditions
                  </CardTitle>
                  <CardDescription>
                    Define conditions to filter your data. You can create multiple filter groups.
                    {filtersLoaded && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        (Loaded from previous session)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AnimatePresence>
                    {filterGroups.map((group, groupIndex) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Filter Group {groupIndex + 1}</h4>
                          <div className="flex items-center gap-2">
                            <Select
                              value={group.logic}
                              onValueChange={(value: 'AND' | 'OR') => updateGroupLogic(group.id, value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                              </SelectContent>
                            </Select>
                            {filterGroups.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFilterGroup(group.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {group.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex} className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Select
                                  value={condition.column}
                                  onValueChange={(value) => updateCondition(group.id, conditionIndex, 'column', value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_COLUMNS.map(column => (
                                      <SelectItem key={column.key} value={column.key}>
                                        {column.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={condition.operator}
                                  onValueChange={(value) => updateCondition(group.id, conditionIndex, 'operator', value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPERATORS[getColumnType(condition.column) as keyof typeof OPERATORS].map(op => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {group.conditions.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeCondition(group.id, conditionIndex)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>

                              {/* Column comparison UI */}
                              {condition.operator.startsWith('column_') && getColumnType(condition.column) === 'number' && (
                                <div className="flex items-center gap-2 flex-wrap ml-4 pl-4 border-l-2 border-muted">
                                  <Label className="text-sm text-muted-foreground">Compare with:</Label>
                                  <Select
                                    value={condition.compareColumn || ''}
                                    onValueChange={(value) => updateCondition(group.id, conditionIndex, 'compareColumn', value)}
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_COLUMNS
                                        .filter(col => col.type === 'number' && col.key !== condition.column)
                                        .map(column => (
                                          <SelectItem key={column.key} value={column.key}>
                                            {column.label}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>

                                </div>
                              )}

                              {/* Regular value input */}
                              {!condition.operator.startsWith('column_') && (
                                <div className="flex items-center gap-2 flex-wrap ml-4 pl-4 border-l-2 border-muted">
                                  <Label className="text-sm text-muted-foreground">Value:</Label>
                                  {getColumnType(condition.column) === 'boolean' ? (
                                    <Select
                                      value={String(condition.value)}
                                      onValueChange={(value) => updateCondition(group.id, conditionIndex, 'value', value === 'true')}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">True</SelectItem>
                                        <SelectItem value="false">False</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={getColumnType(condition.column) === 'number' ? 'number' : 'text'}
                                      value={condition.value}
                                      onChange={(e) => updateCondition(group.id, conditionIndex, 'value', 
                                        getColumnType(condition.column) === 'number' ? Number(e.target.value) : e.target.value
                                      )}
                                      placeholder={
                                        getColumnType(condition.column) === 'string' ? 'Enter text...' :
                                        getColumnType(condition.column) === 'number' ? 'Enter number...' :
                                        'Enter value...'
                                      }
                                      className="w-48"
                                      step={getColumnType(condition.column) === 'number' ? '0.1' : undefined}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addCondition(group.id)}
                          className="w-full"
                        >
                          Add Condition
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <Button
                    variant="outline"
                    onClick={addFilterGroup}
                    className="w-full"
                  >
                    Add Filter Group
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview and Actions */}
            <motion.div variants={fadeInUp} className="space-y-6">
              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Preview
                  </CardTitle>
                  <CardDescription>
                    See how many records match your filters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {filteredRecords.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Records Found
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span className="font-medium">{allRecords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filtered:</span>
                        <span className="font-medium text-primary">{filteredRecords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percentage:</span>
                        <span className="font-medium">
                          {allRecords.length > 0 ? Math.round((filteredRecords.length / allRecords.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Filter Summary */}
                    {filterGroups.some(group => group.conditions.length > 0) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Applied Filters:</Label>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {filterGroups.map((group, groupIndex) => (
                              <div key={group.id} className="text-xs">
                                <div className="font-medium text-muted-foreground mb-1">
                                  Group {groupIndex + 1} ({group.logic})
                                </div>
                                {group.conditions.map((condition, conditionIndex) => (
                                  <div key={conditionIndex} className="ml-2 p-2 bg-muted/50 rounded text-xs">
                                    {formatFilterCondition(condition)}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold">Reset Filters</h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Are you sure you want to reset all filters to the default configuration? 
              This will remove all your current filter conditions and restore the default 
              &quot;Pending Since &gt;= TAT Days&quot; filter.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
