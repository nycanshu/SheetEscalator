import UploadForm from '@/components/UploadForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sheet-Automate
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload Excel files, identify pending records, and send escalation emails automatically.
            Streamline your workflow with intelligent data processing.
          </p>
        </div>

        {/* Main Upload Section */}
        <div className="max-w-4xl mx-auto">
          <UploadForm />
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Smart Parsing</CardTitle>
              <CardDescription>
                Automatically parse Excel files and identify pending records based on your business rules.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Dashboard View</CardTitle>
              <CardDescription>
                View, filter, and sort pending records with an intuitive dashboard interface.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Email Escalation</CardTitle>
              <CardDescription>
                Send escalation emails directly from the dashboard with customizable templates.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Already have data uploaded?</p>
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
