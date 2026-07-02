import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Truck, FileText, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Trusted by 500+ Bank Branches
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl"
          >
            Premium Stationery <br className="hidden md:block" />
            <span className="text-primary italic font-serif">for Banking</span> Institutions
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
          >
            Specialized printing and stationery supplies with full GST compliance. Serving the Indian banking sector with precision and reliability since 1996.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/catalog">
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold group">
                Browse Catalog
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-semibold">
                Register Your Bank
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Why Banks Choose Us</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              We understand the strict requirements of financial institutions. Our portal simplifies procurement while maintaining full compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<FileText className="h-8 w-8 text-primary" />}
              title="GST Compliant Invoicing"
              description="Automated GST calculations (18%) with proper documentation for easy ITC claims."
            />
            <FeatureCard 
              icon={<Building2 className="h-8 w-8 text-primary" />}
              title="Bank-Specific Products"
              description="From NEFT/RTGS forms to registers and branded envelopes, we stock what you need."
            />
            <FeatureCard 
              icon={<Truck className="h-8 w-8 text-primary" />}
              title="Fast Pan-India Delivery"
              description="Reliable shipping logistics ensuring your branch never runs out of critical supplies."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 text-primary" />}
              title="Secure Ordering Portal"
              description="OTP-verified logins and strict role-based access for your procurement officers."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
      <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
