'use client';

import { useState, useEffect } from 'react';
import { useFilteredData } from '@/hooks/useFilteredData';
import PendingTable from '@/components/PendingTable';
import EmailModal from '@/components/EmailModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Record } from '@/lib/dexieClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, RefreshCw, AlertCircle, Home, Trash2, BarChart3, Mail, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { clearAllData, clearAppliedFilters } from '@/lib/dexieClient';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export default function Dashboard() {
  const { records, departments, loading, error, refresh, appliedFilters, totalRecords, filteredCount } = useFilteredData();
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Refresh data when page becomes visible (user navigates back from filter page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    const handleFocus = () => {
      refresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

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
      await clearAllData();
      clearAppliedFilters(); // Also clear stored filters
      await refresh();
      toast.success('All data and filters cleared successfully');
      setIsClearModalOpen(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearFilters = () => {
    clearAppliedFilters();
    refresh();
    toast.success('Filters cleared successfully');
  };

  const pendingCount = records.filter(r => !r.mailSent).length;
  const sentCount = records.filter(r => r.mailSent).length;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Error Loading Data
              </motion.h2>
              <motion.p 
                className="text-muted-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {error}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              {appliedFilters ? 
                `Viewing ${filteredCount} of ${totalRecords} records (filtered)` : 
                'Manage records and send escalation emails'
              }
            </p>
            {appliedFilters && (
              <div className="mt-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="text-xs"
                >
                  <Link href="/sheet/filters">
                    <Filter className="h-3 w-3 mr-1" />
                    Modify Filters
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </motion.div>
          <motion.div 
            className="flex flex-wrap gap-2 mt-4 sm:mt-0"
            variants={fadeInUp}
          >
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="group">
              <RefreshCw className={`h-4 w-4 mr-2 group-hover:rotate-180 transition-transform ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" asChild className="group">
              <Link href="/">
                <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="group">
              <Link href="/#upload">
                <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Upload New File
              </Link>
            </Button>
            <AnimatePresence>
              {records.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsClearModalOpen(true)}
                    disabled={loading}
                    className="group"
                  >
                    <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Clear Data
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn}>
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {appliedFilters ? 'Filtered Records' : 'Total Records'}
                </CardTitle>
                <Badge variant="outline">{records.length}</Badge>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {records.length}
                </motion.div>
                <p className="text-xs text-muted-foreground">
                  {appliedFilters ? 
                    `Showing ${filteredCount} of ${totalRecords} records` : 
                    'All records from uploaded files'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Pending
                </CardTitle>
                <Badge variant="destructive">{pendingCount}</Badge>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-destructive"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  {pendingCount}
                </motion.div>
                <p className="text-xs text-muted-foreground">
                  Records awaiting escalation
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Emails Sent
                </CardTitle>
                <Badge variant="default">{sentCount}</Badge>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-green-600 dark:text-green-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  {sentCount}
                </motion.div>
                <p className="text-xs text-muted-foreground">
                  Escalation emails sent
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PendingTable
            data={records}
            departments={departments}
            onSendEmail={handleSendEmail}
            loading={loading}
          />
        </motion.div>

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
