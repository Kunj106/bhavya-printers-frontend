import React from "react";
import { Link } from "wouter";
import { FileText } from "lucide-react";
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

      <div className="max-w-md">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <FileText className="h-10 w-10 text-primary mb-4" />

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
      </div>
    </div>
  );
}