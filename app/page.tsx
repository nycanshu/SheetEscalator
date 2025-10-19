import UploadForm from '@/components/UploadForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Sheet-Automate
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload Excel files, identify pending records, and send escalation emails automatically.
            Streamline your workflow with intelligent data processing.
          </p>
        </div>

        {/* Main Upload Section */}
        <div className="max-w-4xl mx-auto">
          <UploadForm />
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Smart Parsing</CardTitle>
              <CardDescription className="text-base">
                Automatically parse Excel files and identify pending records based on your business rules with intelligent column detection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Dashboard View</CardTitle>
              <CardDescription className="text-base">
                View, filter, and sort pending records with an intuitive dashboard interface. Real-time updates and persistent storage.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Email Escalation</CardTitle>
              <CardDescription className="text-base">
                Send escalation emails directly from the dashboard with customizable templates and tracking capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Already have data uploaded?</p>
          <Button asChild size="lg">
            <Link href="/dashboard">
              <BarChart3 className="h-5 w-5 mr-2" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
