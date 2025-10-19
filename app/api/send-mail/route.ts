import { NextRequest, NextResponse } from 'next/server';
import { mailer } from '@/lib/mailer';
import { updateMailSent, getAllRecords } from '@/lib/dexieClient';

export async function POST(request: NextRequest) {
  try {
    // Check if email is configured
    if (!mailer.isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Rate limiting removed for simplicity

    const body = await request.json();
    const { recordId, to, subject, body: emailBody } = body;

    // Validate required fields
    if (!recordId || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: recordId, to, subject, body' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Find the record to verify it exists
    const records = await getAllRecords();
    const record = records.find(r => r.id === recordId);
    
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Send email
    const result = await mailer.sendMail({
      to,
      subject,
      body: emailBody
    });

    if (result.success) {
      // Update mail sent status in IndexedDB
      await updateMailSent(recordId, true);
      
      return NextResponse.json({
        success: true,
        recordId,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          recordId,
          error: result.error || 'Failed to send email'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send mail error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
