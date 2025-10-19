'use client';

import UploadForm from '@/components/UploadForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3, Mail, ArrowRight, Sparkles, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            variants={fadeInUp}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Intelligent Data Processing</span>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            SheetEscalator
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            variants={fadeInUp}
          >
            Transform your Excel workflows with intelligent parsing, automated escalation, and seamless data management.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-md mx-auto"
            variants={fadeInUp}
          >
            <Button asChild size="lg" className="px-8 py-6 group w-full sm:w-auto">
              <Link href="#upload">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 w-full sm:w-auto">
              <Link href="/dashboard">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Upload Section */}
        <motion.div 
          className="max-w-4xl mx-auto mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <UploadForm />
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline your data processing workflow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div variants={scaleIn}>
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg h-full">
                <CardHeader className="pb-4">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <FileText className="h-8 w-8 text-primary" />
                  </motion.div>
                  <CardTitle className="text-xl mb-3">Smart Parsing</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Automatically parse Excel files with intelligent column detection and identify pending records based on your business rules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Excel & CSV Support', 'Auto Column Detection', 'Business Rule Engine'].map((feature, index) => (
                      <motion.div 
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={scaleIn}>
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg h-full">
                <CardHeader className="pb-4">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <CardTitle className="text-xl mb-3">Dashboard View</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    View, filter, and sort pending records with an intuitive dashboard interface and real-time updates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Real-time Updates', 'Advanced Filtering', 'Persistent Storage'].map((feature, index) => (
                      <motion.div 
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={scaleIn}>
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg h-full">
                <CardHeader className="pb-4">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <CardTitle className="text-xl mb-3">Email Escalation</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Send escalation emails directly from the dashboard with customizable templates and tracking capabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['SMTP Integration', 'Custom Templates', 'Send Tracking'].map((feature, index) => (
                      <motion.div 
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div 
          className="mb-20"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose SheetEscalator?</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Built for efficiency, designed for simplicity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Process files in seconds" },
              { icon: Shield, title: "Secure", desc: "Your data stays private" },
              { icon: Clock, title: "Time Saving", desc: "Automate repetitive tasks" },
              { icon: Sparkles, title: "Smart", desc: "AI-powered insights" }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <benefit.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-base text-muted-foreground mb-8">
              Upload your first Excel file and experience the power of automated data processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-md mx-auto">
              <Button asChild size="lg" className="px-8 py-6 group w-full sm:w-auto">
                <Link href="#upload">
                  Upload Your File
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-6 w-full sm:w-auto">
                <Link href="/dashboard">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}