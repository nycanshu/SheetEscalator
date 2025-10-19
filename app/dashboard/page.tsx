'use client';

import { useState } from 'react';
import { usePendingData } from '@/hooks/usePendingData';
import PendingTable from '@/components/PendingTable';
import EmailModal from '@/components/EmailModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Record } from '@/lib/dexieClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, RefreshCw, AlertCircle, Home, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { clearRecords } from '@/lib/dexieClient';

export default function Dashboard() {
  const { records, departments, loading, error, refresh } = usePendingData();
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSendEmail = (record: Record) => {
    setSelectedRecord(record);
    setIsEmailModalOpen(true);
  };

  const handleEmailSent = () => {
    refresh();
    toast.success('Email sent successfully!');
  };

  const handleRefresh = async () => {
    await refresh();
    toast.success('Data refreshed');
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearRecords();
      await refresh();
      toast.success('All data cleared successfully');
      setIsClearModalOpen(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const pendingCount = records.filter(r => !r.mailSent).length;
  const sentCount = records.filter(r => r.mailSent).length;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage pending records and send escalation emails
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Upload className="h-4 w-4 mr-2" />
                Upload New File
              </Link>
            </Button>
            {records.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setIsClearModalOpen(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Badge variant="outline">{records.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
              <p className="text-xs text-muted-foreground">
                All pending records from uploaded files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Badge variant="destructive">{pendingCount}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Records awaiting escalation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Badge variant="default">{sentCount}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sentCount}</div>
              <p className="text-xs text-muted-foreground">
                Escalation emails sent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <PendingTable
          data={records}
          departments={departments}
          onSendEmail={handleSendEmail}
          loading={loading}
        />

        {/* Email Modal */}
        <EmailModal
          record={selectedRecord}
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedRecord(null);
          }}
          onEmailSent={handleEmailSent}
        />

        {/* Clear Data Confirmation Modal */}
        <ConfirmationModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={handleClearData}
          title="Clear All Data"
          description="This will permanently delete all uploaded files and records. You will need to upload your files again to continue. This action cannot be undone."
          confirmText="Clear All Data"
          confirmVariant="destructive"
          isLoading={isClearing}
        />
      </div>
    </div>
  );
}
