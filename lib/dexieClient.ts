import Dexie, { Table } from 'dexie';

// Upload metadata - stores only the latest upload info
export interface Upload {
  id?: number;
  filename: string;
  uploadedAt: Date;
}

// Pending records only - stores only records that need escalation (Pending Since > TAT Days)
// This is efficient as we only store actionable records, not all parsed data
export interface Record {
  id?: number;
  uploadId: number;
  department: string;
  fileActivity: string;
  currentLevel: string;
  pendingSince: number;
  tatDays: number;
  nextLevel: string;
  escalationEmail: string;
  remarks: string;
  mailSent: boolean;
}

class PendingFilesDB extends Dexie {
  uploads!: Table<Upload>;
  records!: Table<Record>;

  constructor() {
    super('PendingFilesDB');
    this.version(1).stores({
      uploads: '++id, filename, uploadedAt',
      records: '++id, uploadId, department, fileActivity, pendingSince, tatDays, escalationEmail, mailSent'
    });
  }
}

// Singleton instance
export const db = new PendingFilesDB();

// Helper methods
export const saveUpload = async (filename: string): Promise<number> => {
  // Clear existing uploads first to ensure only ONE upload entry exists at any time
  // This prevents storage accumulation and maintains efficient storage
  await db.uploads.clear();
  
  const uploadId = await db.uploads.add({
    filename,
    uploadedAt: new Date()
  });
  return uploadId as number;
};

export const saveRecords = async (records: Omit<Record, 'id'>[]): Promise<void> => {
  await db.records.bulkAdd(records);
};

export const getAllRecords = async (): Promise<Record[]> => {
  return await db.records.orderBy('id').toArray();
};

export const updateMailSent = async (recordId: number, mailSent: boolean): Promise<void> => {
  await db.records.update(recordId, { mailSent });
};

export const clearRecords = async (): Promise<void> => {
  await db.records.clear();
};

// Clear all data - used for proper override when uploading new files
// This ensures we don't accumulate data and maintain efficient storage
export const clearAllData = async (): Promise<void> => {
  await db.records.clear();
  await db.uploads.clear();
};

export const getRecordsByUploadId = async (uploadId: number): Promise<Record[]> => {
  return await db.records.where('uploadId').equals(uploadId).toArray();
};

export const getDepartments = async (): Promise<string[]> => {
  const records = await db.records.toArray();
  const departments = [...new Set(records.map(r => r.department))];
  return departments.sort();
};
