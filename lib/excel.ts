import * as XLSX from 'xlsx';
import { Record } from './dexieClient';

export interface ParsedRow {
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

const REQUIRED_COLUMNS = [
  'Department',
  'File/Activity',
  'Current Level',
  'Pending Since (Days)',
  'TAT (Days)',
  'Next Level',
  'Escalation Authority Email',
  'Remarks',
  'Mail Sent Status'
];

export function parseBufferToRows(buffer: ArrayBuffer): ParsedRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('No sheets found in the file');
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as any[][];

    // Trim whitespace from headers for comparison
    const trimmedHeaders = headers.map(h => h.trim());
    
    // Validate required columns (case-insensitive and whitespace-tolerant)
    const missingColumns = REQUIRED_COLUMNS.filter(requiredCol => {
      return !trimmedHeaders.some(header => 
        header.toLowerCase() === requiredCol.toLowerCase()
      );
    });
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Create column mapping (case-insensitive and whitespace-tolerant)
    const columnMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      const trimmedHeader = header.trim();
      // Map both original and trimmed versions
      columnMap[trimmedHeader] = index;
      columnMap[header] = index;
    });

    // Parse rows
    const parsedRows: ParsedRow[] = [];
    
    dataRows.forEach((row, rowIndex) => {
      try {
        // Skip empty rows
        if (row.every(cell => cell === undefined || cell === null || cell === '')) {
          return;
        }

        const parsedRow: ParsedRow = {
          department: String(row[columnMap['Department']] || '').trim(),
          fileActivity: String(row[columnMap['File/Activity']] || '').trim(),
          currentLevel: String(row[columnMap['Current Level']] || '').trim(),
          pendingSince: parseNumber(row[columnMap['Pending Since (Days)']], `Row ${rowIndex + 2}, Pending Since (Days)`),
          tatDays: parseNumber(row[columnMap['TAT (Days)']], `Row ${rowIndex + 2}, TAT (Days)`),
          nextLevel: String(row[columnMap['Next Level']] || '').trim(),
          escalationEmail: String(row[columnMap['Escalation Authority Email']] || '').trim(),
          remarks: String(row[columnMap['Remarks']] || '').trim(),
          mailSent: parseBoolean(row[columnMap['Mail Sent Status']] || false)
        };

        // Validate required fields
        if (!parsedRow.department || !parsedRow.fileActivity || !parsedRow.escalationEmail) {
          throw new Error(`Row ${rowIndex + 2}: Missing required data in Department, File/Activity, or Escalation Email`);
        }

        // Validate email format
        if (!isValidEmail(parsedRow.escalationEmail)) {
          throw new Error(`Row ${rowIndex + 2}: Invalid email format: ${parsedRow.escalationEmail}`);
        }

        parsedRows.push(parsedRow);
      } catch (error) {
        throw new Error(`Error parsing row ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return parsedRows;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function filterPending(rows: ParsedRow[]): ParsedRow[] {
  return rows.filter(row => row.pendingSince > row.tatDays);
}

export function getAllParsedRows(rows: ParsedRow[]): ParsedRow[] {
  return rows; // Return all rows without filtering
}

function parseNumber(value: any, context: string): number {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${context}: Value is required`);
  }
  
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${context}: Must be a non-negative number, got: ${value}`);
  }
  
  return Math.floor(num);
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'sent';
  }
  if (typeof value === 'number') return value > 0;
  return false;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function convertToRecords(parsedRows: ParsedRow[], uploadId: number): Omit<Record, 'id'>[] {
  return parsedRows.map(row => ({
    uploadId,
    department: row.department,
    fileActivity: row.fileActivity,
    currentLevel: row.currentLevel,
    pendingSince: row.pendingSince,
    tatDays: row.tatDays,
    nextLevel: row.nextLevel,
    escalationEmail: row.escalationEmail,
    remarks: row.remarks,
    mailSent: row.mailSent
  }));
}
