import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analytics, MONTH_NAMES } from '@/lib/api';
import { formatRupee } from '@/lib/utils';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Package, Building2, ShoppingBag, TrendingUp, Clock, IndianRupee, Loader2, CalendarDays } from 'lucide-react';

function StatCard({
  icon, label, value, sub, iconBg,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; iconBg: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-primary/40 transition-colors duration-200">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analytics.dashboard,
  });
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: analytics.revenue,
  });
  const { data: topBanks, isLoading: banksLoading } = useQuery({
    queryKey: ['analytics', 'top-banks'],
    queryFn: analytics.topBanks,
  });
  const { data: monthlyGst, isLoading: gstLoading } = useQuery({
    queryKey: ['analytics', 'monthly-gst'],
    queryFn: analytics.monthlyGst,
  });

  const revenueChartData = (revenue ?? [])
    .slice(-12)
    .map((r) => ({
      name: `${MONTH_NAMES[r.month]} '${String(r.year).slice(2)}`,
      Revenue: r.totalRevenue,
      GST: r.gstCollected,
      Orders: r.orderCount,
    }));

  const topBanksData = (topBanks ?? []).map((b) => ({
    name: `${b.bankName} - ${b.branchName}`,
    Spend: b.totalSpend,
    Orders: b.orderCount,
  }));

  const totalTaxable =
    (monthlyGst ?? []).reduce(
      (sum, order) => sum + order.taxableAmount,
      0
    );

  const totalGST =
    (monthlyGst ?? []).reduce(
      (sum, order) => sum + order.gstAmount,
      0
    );

  const grandTotal =
    (monthlyGst ?? []).reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

  const downloadGSTReport = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text("Bhavya Printers", 14, 15);

    doc.setFontSize(12);

    doc.text("GST Collection Report", 14, 24);

    autoTable(doc, {

      head: [[
        "Order ID",
        "Date",
        "Bank",
        "Branch",
        "Taxable",
        "GST",
        "Total"
      ]],

      body: (monthlyGst ?? []).map(order => [
        `ORD-${String(order.orderId).padStart(4, "0")}`,
        new Date(order.orderDate).toLocaleDateString("en-IN"),
        order.bankName,
        order.branchName,
        formatRupee(order.taxableAmount),
        formatRupee(order.gstAmount),
        formatRupee(order.totalAmount),
      ]),

      foot: [[
        "",
        "TOTAL",

        formatRupee(totalTaxable),

        formatRupee(totalGST),

        formatRupee(grandTotal)
      ]],

      startY: 32

    });

    doc.save("GST_Report.pdf");

  };

  const printGSTReport = () => {

    window.print();

  };



  if (statsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Bhavya Printers operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag className="h-6 w-6 text-primary" />} label="Total Orders" value={stats?.totalOrders ?? 0} sub={`${stats?.thisMonthOrders ?? 0} this month`} iconBg="bg-primary/10" />
        <StatCard icon={<IndianRupee className="h-6 w-6 text-emerald-500" />} label="Total Revenue" value={formatRupee(stats?.totalRevenue ?? 0)} sub={`${formatRupee(stats?.thisMonthRevenue ?? 0)} this month`} iconBg="bg-emerald-500/10" />
        <StatCard icon={<Building2 className="h-6 w-6 text-blue-400" />} label="Registered Banks" value={stats?.totalBanks ?? 0} iconBg="bg-blue-400/10" />
        <StatCard icon={<Package className="h-6 w-6 text-purple-400" />} label="Products" value={stats?.totalProducts ?? 0} iconBg="bg-purple-400/10" />
        <StatCard icon={<TrendingUp className="h-6 w-6 text-emerald-500" />} label="Delivered" value={stats?.deliveredOrders ?? 0} iconBg="bg-emerald-500/10" />
        <StatCard icon={<Clock className="h-6 w-6 text-amber-400" />} label="Pending Orders" value={stats?.pendingOrders ?? 0} iconBg="bg-amber-400/10" />
        <StatCard icon={<CalendarDays className="h-6 w-6 text-primary" />} label="This Month Orders" value={stats?.thisMonthOrders ?? 0} iconBg="bg-primary/10" />
        <StatCard icon={<IndianRupee className="h-6 w-6 text-emerald-500" />} label="This Month Revenue" value={formatRupee(stats?.thisMonthRevenue ?? 0)} iconBg="bg-emerald-500/10" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">Monthly Revenue</h2>
        <p className="text-sm text-muted-foreground mb-6">Revenue and GST collected over the last 12 months</p>
        {revLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(41,100%,47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(41,100%,47%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142,70%,45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(142,70%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,52%,25%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215,16%,65%)' }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(215,16%,65%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(221,44%,18%)', border: '1px solid hsl(214,52%,25%)', borderRadius: 8 }}
                formatter={(v: number, name: string) => [formatRupee(v), name]}
              />
              <Legend />
              <Area type="monotone" dataKey="Revenue" stroke="hsl(41,100%,47%)" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="GST" stroke="hsl(142,70%,45%)" fill="url(#gstGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Bank</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Spend</th>
            </tr>
          </thead>

          <tbody>

            {topBanksData.map((bank) => (

              <tr key={bank.name}>

                <td>{bank.name}</td>

                <td className="text-right">
                  {bank.Orders}
                </td>

                <td className="text-right font-semibold">
                  {formatRupee(bank.Spend)}
                </td>

              </tr>

            ))}

          </tbody>
        </table>
      </div>

      {/* Top Banks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Top Banks by Spend</h2>
          <p className="text-sm text-muted-foreground mb-6">Highest-value banking clients</p>
          {banksLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topBanksData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,52%,25%)" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(215,16%,65%)' }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: 'hsl(215,16%,65%)' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(221,44%,18%)', border: '1px solid hsl(214,52%,25%)', borderRadius: 8 }}
                  formatter={(v: number) => [formatRupee(v), 'Total Spend']}
                />
                <Bar dataKey="Spend" fill="hsl(41,100%,47%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>



        {/* Monthly GST Table */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="text-lg font-semibold">
                Monthly GST Summary
              </h2>

              <p className="text-sm text-muted-foreground">
                Collected GST breakdown
              </p>

            </div>

            <div className="flex gap-2">

              <Button
                size="sm"
                variant="outline"
                onClick={downloadGSTReport}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open("/admin/reports/gst?print=true", "_blank");
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

            </div>

          </div>
          {gstLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-auto max-h-[220px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">OrderId</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 font-semibold">Bank</th>
                    <th className="px-3 py-2 font-semibold">Branch</th>
                    <th className="px-3 py-2 font-semibold text-right">Taxable</th>
                    <th className="px-3 py-2 font-semibold text-right">GST</th>
                    <th className="px-3 py-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthlyGst ?? []).map((order) => (
                    <tr key={order.orderId} className="border-b border-border/50">
                      <td className="px-3 py-2 whitespace-nowrap">#ORD-{order.orderId}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(order.orderDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 py-2">{order.bankName}</td>
                      <td className="px-3 py-2">{order.branchName}</td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                        {formatRupee(order.taxableAmount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                        {formatRupee(order.gstAmount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                        {formatRupee(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-primary/5 font-bold">

                    <td colSpan={4} className="px-3 py-3">
                      GRAND TOTAL
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                      {formatRupee(totalTaxable)}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-primary">
                      {formatRupee(totalGST)}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                      {formatRupee(grandTotal)}
                    </td>

                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}