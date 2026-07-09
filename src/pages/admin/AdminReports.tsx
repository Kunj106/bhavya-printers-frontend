import React from "react";
import { Link } from "wouter";
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReports() {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">

      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Reports
        </h1>

        <p className="text-muted-foreground mt-2">
          Generate and download business reports.
        </p>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* GST Report */}

        <div className="bg-card border rounded-xl p-6 shadow-sm">

          <FileText className="h-10 w-10 text-primary mb-4"/>

          <h2 className="text-xl font-semibold">
            GST Report
          </h2>

          <p className="text-muted-foreground mt-2 mb-6">

            View every order along with GST collected.

          </p>

          <Link href="/admin/reports/gst">

            <Button className="w-full">

              Open Report

            </Button>

          </Link>

        </div>

        {/* Revenue */}

        <div className="bg-card border rounded-xl p-6 shadow-sm">

          <TrendingUp className="h-10 w-10 text-emerald-500 mb-4"/>

          <h2 className="text-xl font-semibold">

            Revenue Report

          </h2>

          <p className="text-muted-foreground mt-2">

            Coming Soon

          </p>

        </div>

        {/* Bank */}

        <div className="bg-card border rounded-xl p-6 shadow-sm">

          <Building2 className="h-10 w-10 text-blue-500 mb-4"/>

          <h2 className="text-xl font-semibold">

            Bank Spend Report

          </h2>

          <p className="text-muted-foreground mt-2">

            Coming Soon

          </p>

        </div>

      </div>

    </div>
  );
}