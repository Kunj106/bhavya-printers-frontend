import React from 'react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="border-t bg-card py-12 md:py-16 print:hidden">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col max-w-sm">
          <Link href="/" className="flex flex-col mb-4">
            <span className="text-2xl font-bold text-primary tracking-tight">Bhavya Printers</span>
            <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase mt-1">Est. 1996 · Bharuch, Gujarat</span>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Trusted stationery partner for Indian banks since 1996. Delivering precision, quality, and compliance in every order. 
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
              ✓ GST Compliant
            </span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              ✓ Pan-India Shipping
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Portal</h3>
            <Link href="/catalog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Catalog</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Bank Login</Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Register Bank</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Return Policy</a>
          </div>
          <div className="flex flex-col gap-3 col-span-2 sm:col-span-1">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <p className="text-sm text-muted-foreground">Support: bhavyaprinters21@gmail.com</p>
            <p className="text-sm text-muted-foreground">Phone: +91 9825024751</p>
            <p className="text-sm text-muted-foreground mt-2">Bharuch, Gujarat, India</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Bhavya Printers. All rights reserved.
      </div>
    </footer>
  );
}
