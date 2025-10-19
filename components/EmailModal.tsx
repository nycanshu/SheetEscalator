'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, X, Clock, AlertTriangle, FileText, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailModalProps {
  record: Record | null;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2 }
};

export default function EmailModal({ record, isOpen, onClose, onEmailSent }: EmailModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Calculate overdue days
  const overdueDays = record ? Math.max(0, record.pendingSince - record.tatDays) : 0;

  // Reset form when record changes
  useEffect(() => {
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
Overdue: ${overdueDays} days
Next Level: ${record.nextLevel}
Remarks: ${record.remarks || 'None'}

The file has been pending for ${record.pendingSince} days, which exceeds the TAT of ${record.tatDays} days by ${overdueDays} days.

Please take necessary action at the earliest.

Best regards,
System`);
    }
  }, [record, overdueDays]);

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
      <DialogContent className="max-w-none w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-h-[95vh] overflow-y-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <DialogHeader className="pb-6">
            <motion.div variants={fadeInUp} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Send Escalation Email</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Send an escalation email for the selected record
                </DialogDescription>
              </div>
            </motion.div>
          </DialogHeader>

          <div className="space-y-8">
            {/* Record Details Card */}
            <motion.div variants={scaleIn}>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Record Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics Row */}
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={fadeInUp}
                  >
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Pending Since</span>
                      </div>
                      <div className="text-xl font-semibold text-orange-600 dark:text-orange-400">
                        {record.pendingSince} days
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">TAT Days</span>
                      </div>
                      <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                        {record.tatDays} days
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Overdue</span>
                      </div>
                      <div className="text-xl font-semibold text-red-600 dark:text-red-400">
                        {overdueDays} days
                      </div>
                    </div>
                  </motion.div>

                  {/* Record Information */}
                  <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    variants={fadeInUp}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Department</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words">
                          {record.department}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">File/Activity</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words leading-relaxed">
                          {record.fileActivity}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Current Level</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words">
                          {record.currentLevel}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Next Level</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words">
                          {record.nextLevel}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Escalation Email</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words">
                          {record.escalationEmail}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Remarks</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/50 border break-words leading-relaxed min-h-[60px]">
                          {record.remarks || 'No remarks provided'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email Form */}
            <motion.div 
              className="space-y-6"
              variants={fadeInUp}
            >
              <div className="space-y-6">
                <div>
                  <Label htmlFor="to" className="text-base font-semibold">To</Label>
                  <Input
                    id="to"
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="mt-2 h-12 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-base font-semibold">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="mt-2 h-12 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="text-base font-semibold">Message Body</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message here..."
                    className="mt-2 min-h-[350px] text-base leading-relaxed resize-y"
                  />
                  <div className="mt-2 text-sm text-muted-foreground">
                    The message will automatically include record details and overdue information.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <DialogFooter className="pt-6 border-t">
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
              variants={fadeInUp}
            >
              <Button 
                variant="outline" 
                onClick={handleClose} 
                disabled={isSending}
                className="w-full sm:w-auto group"
              >
                <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending}
                className="w-full sm:w-auto group"
              >
                {isSending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Send Email
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}