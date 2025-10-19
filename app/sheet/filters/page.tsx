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
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllRecords } from '@/lib/dexieClient';
import { ParsedRow } from '@/lib/excel';
import toast from 'react-hot-toast';

interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';
  value: string | number;
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
    { value: 'less_equal', label: 'Less than or equal' }
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
  const [allRecords, setAllRecords] = useState<ParsedRow[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ column: 'pendingSince', operator: 'greater_than', value: 0 }],
      logic: 'AND'
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRecords();
  }, []);

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
          const recordValue = record[condition.column as keyof ParsedRow];
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
  }, [allRecords, filterGroups]);

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
          ? { ...group, conditions: [...group.conditions, { column: 'department', operator: 'contains', value: '' }] }
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
              conditions: group.conditions.map((condition, index) => 
                index === conditionIndex 
                  ? { ...condition, [field]: value }
                  : condition
              )
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

  const handleApplyFilters = async () => {
    setApplyingFilters(true);
    try {
      // Store filtered records in a way that dashboard can access them
      // For now, we'll use localStorage to pass the filter criteria
      localStorage.setItem('appliedFilters', JSON.stringify(filterGroups));
      localStorage.setItem('filteredRecordCount', filteredRecords.length.toString());
      
      toast.success(`Applied filters! Found ${filteredRecords.length} matching records.`);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setApplyingFilters(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const getColumnType = (columnKey: string) => {
    const column = AVAILABLE_COLUMNS.find(col => col.key === columnKey);
    return column?.type || 'string';
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
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Total Records: {allRecords.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Filtered Records: {filteredRecords.length}</span>
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
                            <div key={conditionIndex} className="flex items-center gap-2 flex-wrap">
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
                                <SelectTrigger className="w-40">
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
                                  placeholder="Enter value..."
                                  className="w-48"
                                />
                              )}

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
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      onClick={handleApplyFilters}
                      disabled={applyingFilters}
                      className="w-full"
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
                      disabled={filteredRecords.length === 0}
                      className="w-full"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Continue to Dashboard
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
