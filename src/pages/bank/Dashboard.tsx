import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatRupee } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Package, FileText, ChevronRight, Plus, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { bank } = useAuth();
  
  const { data: bankOrders, isLoading } = useQuery({
    queryKey: ['orders', 'bank', bank?.id],
    queryFn: () => orders.byBank(bank!.id),
    enabled: !!bank?.id,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentOrders = bankOrders ? [...bankOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {bank?.bankName} ({bank?.branchName})
          </p>
        </div>
        <Link href="/orders/new">
          <Button size="lg" className="shadow-sm">
            <Plus className="mr-2 h-5 w-5" />
            Place New Order
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold">{bankOrders?.length || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GST Details</p>
              <h3 className="text-lg font-bold">{bank?.gstNo}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-semibold">Order History</h2>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground mt-1 mb-6">You haven't placed any stationery orders yet.</p>
            <Link href="/orders/new">
              <Button>Place Your First Order</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium">Total Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium">#ORD-{order.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {order.items.length} product{order.items.length !== 1 && 's'}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatRupee(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
