'use client';

import { useState } from 'react';
import { Record } from '@/lib/dexieClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailModalProps {
  record: Record | null;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent: () => void;
}

export default function EmailModal({ record, isOpen, onClose, onEmailSent }: EmailModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Reset form when record changes
  useState(() => {
    if (record) {
      setTo(record.escalationEmail);
      setSubject(`Escalation Required: ${record.fileActivity} - ${record.department}`);
      setBody(`Dear ${record.nextLevel},

This is to bring to your attention that the following file/activity requires immediate escalation:

File/Activity: ${record.fileActivity}
Department: ${record.department}
Current Level: ${record.currentLevel}
Pending Since: ${record.pendingSince} days
TAT: ${record.tatDays} days
Next Level: ${record.nextLevel}
Remarks: ${record.remarks}

The file has been pending for ${record.pendingSince} days, which exceeds the TAT of ${record.tatDays} days.

Please take necessary action at the earliest.

Best regards,
System`);
    }
  });

  const handleSend = async () => {
    if (!record || !to || !subject || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: record.id,
          to,
          subject,
          body,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email sent successfully!');
        onEmailSent();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Escalation Email</span>
          </DialogTitle>
          <DialogDescription>
            Send an escalation email for the selected record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Record Details */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Record Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Department:</span> {record.department}
                </div>
                <div>
                  <span className="font-medium">File/Activity:</span> {record.fileActivity}
                </div>
                <div>
                  <span className="font-medium">Current Level:</span> {record.currentLevel}
                </div>
                <div>
                  <span className="font-medium">Next Level:</span> {record.nextLevel}
                </div>
                <div>
                  <span className="font-medium">Pending Since:</span> 
                  <Badge variant="destructive" className="ml-2">
                    {record.pendingSince} days
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">TAT:</span> 
                  <Badge variant="outline" className="ml-2">
                    {record.tatDays} days
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Remarks:</span> {record.remarks}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[200px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
