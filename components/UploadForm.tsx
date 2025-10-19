'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, File, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/parse-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Save to IndexedDB on client side
      try {
        // Save upload metadata
        const dbUploadId = await saveUpload(result.filename);
        
        // Convert to records format
        const records = convertToRecords(result.pending, dbUploadId);
        
        // Clear old records and save new ones
        await clearRecords();
        await saveRecords(records);
        
        toast.success(`Successfully parsed ${result.pendingCount} pending records from ${result.totalRows} total rows.`);
        
        // Navigate to dashboard
        router.push('/dashboard');
        
        // Call success callback if provided
        onUploadSuccess?.();
      } catch (dbError) {
        console.error('Database error:', dbError);
        toast.error('Failed to save data to local storage');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={`text-center transition-colors ${
              isDragging ? 'bg-blue-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <File className="h-8 w-8" />
                  <span className="text-lg font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div className="flex space-x-2 justify-center">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? 'Processing...' : 'Upload & Parse'}
                  </Button>
                  <Button variant="outline" onClick={clearFile}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your Excel file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  Supports .xlsx, .xls, and .csv files (max 10MB)
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Required columns:</p>
            <p className="mt-1">
              Department, File/Activity, Current Level, Pending Since (Days), 
              TAT (Days), Next Level, Escalation Authority Email, Remarks, Mail Sent Status
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
