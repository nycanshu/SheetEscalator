import { NextRequest, NextResponse } from 'next/server';
import { parseBufferToRows, filterPending } from '@/lib/excel';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10') * 1024 * 1024; // Convert MB to bytes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${process.env.MAX_UPLOAD_SIZE_MB || 10}MB.` },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Parse the Excel file
    const parsedRows = parseBufferToRows(buffer);
    
    // Filter pending rows (where Pending Since > TAT Days)
    const pendingRows = filterPending(parsedRows);

    // Generate upload ID
    const uploadId = uuidv4();

    // Return the parsed data to be saved on the client side
    return NextResponse.json({
      uploadId,
      pendingCount: pendingRows.length,
      totalRows: parsedRows.length,
      pending: pendingRows,
      filename: file.name
    });

  } catch (error) {
    console.error('Parse Excel error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return appropriate error status based on error type
    if (errorMessage.includes('Missing required columns') || 
        errorMessage.includes('Invalid file type') ||
        errorMessage.includes('File too large')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse Excel file. Please check the file format and try again.' },
      { status: 500 }
    );
  }
}
