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
          <div className="text-center text-gray-500">
            No pending records found. Upload an Excel file to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Records ({filteredAndSortedData.length} of {data.length})</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="department">Department</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="fileActivity">File/Activity</SortButton>
                </TableHead>
                <TableHead>Current Level</TableHead>
                <TableHead>
                  <SortButton field="pendingSince">Pending Since</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="tatDays">TAT Days</SortButton>
                </TableHead>
                <TableHead>Next Level</TableHead>
                <TableHead>
                  <SortButton field="escalationEmail">Escalation Email</SortButton>
                </TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.department}</TableCell>
                  <TableCell>{record.fileActivity}</TableCell>
                  <TableCell>{record.currentLevel}</TableCell>
                  <TableCell>{record.pendingSince} days</TableCell>
                  <TableCell>{record.tatDays} days</TableCell>
                  <TableCell>{record.nextLevel}</TableCell>
                  <TableCell className="text-sm">{record.escalationEmail}</TableCell>
                  <TableCell className="max-w-xs truncate">{record.remarks}</TableCell>
                  <TableCell>
                    <Badge variant={record.mailSent ? "default" : "secondary"}>
                      {record.mailSent ? "Sent" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => onSendEmail(record)}
                      disabled={record.mailSent}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {record.mailSent ? "Sent" : "Send"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
