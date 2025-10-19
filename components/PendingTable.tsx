'use client';

import { useState, useMemo } from 'react';
import { Record } from '@/lib/dexieClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Mail, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

interface PendingTableProps {
  data: Record[];
  departments: string[];
  onSendEmail: (record: Record) => void;
  loading?: boolean;
}

type SortField = 'department' | 'fileActivity' | 'pendingSince' | 'tatDays' | 'escalationEmail';
type SortDirection = 'asc' | 'desc';

export default function PendingTable({ data, departments, onSendEmail, loading }: PendingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [mailSentFilter, setMailSentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('pendingSince');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(record => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        record.department.toLowerCase().includes(searchLower) ||
        record.fileActivity.toLowerCase().includes(searchLower) ||
        record.currentLevel.toLowerCase().includes(searchLower) ||
        record.nextLevel.toLowerCase().includes(searchLower) ||
        record.escalationEmail.toLowerCase().includes(searchLower) ||
        record.remarks.toLowerCase().includes(searchLower);

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;

      // Mail sent filter
      const matchesMailSent = mailSentFilter === 'all' || 
        (mailSentFilter === 'sent' && record.mailSent) ||
        (mailSentFilter === 'pending' && !record.mailSent);

      return matchesSearch && matchesDepartment && matchesMailSent;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'pendingSince' || sortField === 'tatDays') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, departmentFilter, mailSentFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading records...</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No pending records found. Upload an Excel file to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records ({filteredAndSortedData.length} of {data.length})</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mailSentFilter} onValueChange={setMailSentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Mail Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto overflow-y-visible">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Department</TableHead>
                <TableHead className="min-w-[200px]">File/Activity</TableHead>
                <TableHead className="min-w-[120px]">Current Level</TableHead>
                <TableHead className="min-w-[100px] text-center">Pending Since</TableHead>
                <TableHead className="min-w-[80px] text-center">TAT Days</TableHead>
                <TableHead className="min-w-[120px]">Next Level</TableHead>
                <TableHead className="min-w-[200px]">Escalation Email</TableHead>
                <TableHead className="min-w-[150px]">Remarks</TableHead>
                <TableHead className="min-w-[100px] text-center">Status</TableHead>
                <TableHead className="min-w-[120px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredAndSortedData.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium min-w-[120px]">{record.department}</TableCell>
                    <TableCell className="min-w-[200px] max-w-[300px] break-words">
                      <div className="break-words leading-relaxed">
                        {record.fileActivity}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px] break-words">
                      <div className="break-words leading-relaxed">
                        {record.currentLevel}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[100px] text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                        {record.pendingSince} days
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[80px] text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {record.tatDays} days
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[120px] break-words">
                      <div className="break-words leading-relaxed">
                        {record.nextLevel}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px] max-w-[250px] break-words">
                      <div className="break-words leading-relaxed text-sm">
                        {record.escalationEmail}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[150px] max-w-[200px] break-words">
                      <div className="break-words leading-relaxed text-sm text-muted-foreground">
                        {record.remarks || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className="flex justify-center"
                      >
                        <Badge variant={record.mailSent ? "default" : "secondary"}>
                          {record.mailSent ? "Sent" : "Pending"}
                        </Badge>
                      </motion.div>
                    </TableCell>
                    <TableCell className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                        className="flex justify-center"
                      >
                        <Button
                          size="sm"
                          onClick={() => onSendEmail(record)}
                          disabled={record.mailSent}
                          className="group"
                        >
                          <Mail className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                          {record.mailSent ? "Sent" : "Send"}
                        </Button>
                      </motion.div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
