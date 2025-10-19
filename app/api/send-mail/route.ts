import { NextRequest, NextResponse } from 'next/server';
import { mailer } from '@/lib/mailer';
import { updateMailSent, getAllRecords } from '@/lib/dexieClient';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || '30');

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_PER_MIN) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check if email is configured
    if (!mailer.isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

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
