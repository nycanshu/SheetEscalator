'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { saveUpload, saveRecords, clearRecords } from '@/lib/dexieClient';
import { convertToRecords } from '@/lib/excel';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/parse-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.pending) {
        // Clear existing data before saving new data
        await clearRecords();
        
        // Save to IndexedDB
        const uploadId = await saveUpload(result.filename);
        const records = convertToRecords(result.pending, uploadId);
        await saveRecords(records);

        toast.success(`Successfully processed ${result.pendingCount} pending records!`);
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        router.push('/dashboard');
      } else {
        throw new Error(result.error || 'Failed to parse Excel file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div id="upload" className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-8">
            <motion.div
              className={`text-center transition-all duration-300 cursor-pointer rounded-lg ${
                isDragging ? 'bg-primary/5 scale-[1.02]' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={(e) => {
                // Only trigger if clicking on the area itself, not on child elements
                if (e.target === e.currentTarget && !selectedFile) {
                  e.preventDefault();
                  e.stopPropagation();
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.click();
                  }
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div 
                      className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3"
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </motion.div>
                      <div className="text-center sm:text-left min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 break-words px-2 sm:px-0">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-sm mx-auto"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button 
                        onClick={handleUpload} 
                        disabled={isUploading}
                        className="w-full sm:flex-1"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Upload & Parse'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={clearFile} 
                        disabled={isUploading}
                        className="w-full sm:w-auto sm:min-w-[100px]"
                      >
                        Clear
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div 
                      className="flex flex-col items-center space-y-4"
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div 
                        className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10"
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Upload className="h-12 w-12 text-primary" />
                      </motion.div>
                      <div className="text-center px-4">
                        <p className="text-lg sm:text-xl font-semibold mb-2">
                          Drop your Excel file here, or{' '}
                          <span className="text-primary hover:underline">browse</span>
                        </p>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Supports .xlsx, .xls, and .csv files up to 10MB
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                          if (fileInput) {
                            fileInput.click();
                          }
                        }}
                        type="button"
                        className="cursor-pointer w-full sm:w-auto"
                        size="lg"
                      >
                        Choose File
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        className="mt-6 p-4 bg-primary/10 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-primary min-w-0">
            <p className="font-medium">Required columns:</p>
            <p className="mt-1 break-words">
              Department, File/Activity, Current Level, Pending Since (Days), 
              TAT (Days), Next Level, Escalation Authority Email, Remarks, Mail Sent Status
            </p>
          </div>
        </div>
      </motion.div>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInputChange}
        className="hidden"
        id="file-upload"
      />
    </div>
  );
}