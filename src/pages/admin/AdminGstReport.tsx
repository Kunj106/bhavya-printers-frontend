import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analytics } from "@/lib/api";
import { formatRupee } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useEffect } from "react";

export default function AdminGstReport() {
  const { data: gstOrders, isLoading } = useQuery({
    queryKey: ["analytics", "monthly-gst"],
    queryFn: analytics.monthlyGst,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("print") === "true") {
        setTimeout(() => {
            window.print();
        }, 500);
     }
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        Loading GST Report...
      </div>
    );
  }

  const totalTaxable = (gstOrders ?? []).reduce(
    (sum, order) => sum + order.taxableAmount,
    0
  );

  const totalGST = (gstOrders ?? []).reduce(
    (sum, order) => sum + order.gstAmount,
    0
  );

  const grandTotal = (gstOrders ?? []).reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const generatedOn = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const downloadGSTReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Bhavya Printers", 14, 15);

    doc.setFontSize(12);
    doc.text("GST Collection Report", 14, 24);

    autoTable(doc, {
      head: [["Order ID", "Bank", "Taxable", "GST", "Total"]],
      body: (gstOrders ?? []).map((order) => [
        `ORD-${String(order.orderId).padStart(4, "0")}`,
        order.bankName,
        formatRupee(order.taxableAmount),
        formatRupee(order.gstAmount),
        formatRupee(order.totalAmount),
      ]),
      foot: [[
        "",
        "TOTAL",
        formatRupee(totalTaxable),
        formatRupee(totalGST),
        formatRupee(grandTotal),
      ]],
      startY: 32,
    });

    doc.save("Bhavya_Printers_GST_Report.pdf");
  };

  const printGSTReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">

      <div className="flex justify-between items-start mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Bhavya Printers
          </h1>

          <h2 className="text-xl font-semibold mt-2">
            GST Collection Report
          </h2>

          <p className="text-muted-foreground mt-2">
            Generated on {generatedOn}
          </p>

        </div>

        <div className="flex gap-3 print:hidden">

          <Button
            variant="outline"
            onClick={downloadGSTReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>

          <Button
            onClick={printGSTReport}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

        </div>

      </div>

      <div className="overflow-x-auto border rounded-lg">

        <table className="w-full text-sm">

          <thead className="bg-muted">

            <tr>

              <th className="px-4 py-3 text-left">
                Order ID
              </th>

              <th className="px-4 py-3 text-left">
                Date
              </th>

              <th className="px-4 py-3 text-left">
                Bank
              </th>

              <th className="px-4 py-3 text-left">
                Branch
              </th>

              <th className="px-4 py-3 text-right">
                Taxable
              </th>

              <th className="px-4 py-3 text-right">
                GST
              </th>

              <th className="px-4 py-3 text-right">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {(gstOrders ?? []).map((order) => (

              <tr
                key={order.orderId}
                className="border-t"
              >

                <td className="px-4 py-3">
                  ORD-{String(order.orderId).padStart(4, "0")}
                </td>

                <td className="px-4 py-3">
                  {order.bankName}
                </td>

                <td className="px-4 py-3 text-right">
                  {formatRupee(order.taxableAmount)}
                </td>

                <td className="px-4 py-3 text-right">
                  {formatRupee(order.gstAmount)}
                </td>

                <td className="px-4 py-3 text-right font-semibold">
                  {formatRupee(order.totalAmount)}
                </td>

              </tr>

            ))}

            <tr className="border-t-2 bg-primary/5 font-bold">

              <td
                colSpan={2}
                className="px-4 py-4"
              >
                GRAND TOTAL
              </td>

              <td className="px-4 py-4 text-right">
                {formatRupee(totalTaxable)}
              </td>

              <td className="px-4 py-4 text-right text-primary">
                {formatRupee(totalGST)}
              </td>

              <td className="px-4 py-4 text-right">
                {formatRupee(grandTotal)}
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}