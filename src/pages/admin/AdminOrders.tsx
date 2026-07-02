import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders, ORDER_STATUSES } from '@/lib/api';
import { formatRupee } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrders() {
  const { data: list, isLoading } = useQuery({ queryKey: ['orders'], queryFn: orders.list });
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => orders.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdatingId(null);
      toast({ title: 'Order status updated' });
    },
    onError: (e: Error) => {
      setUpdatingId(null);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const filtered = (list ?? [])
    .filter((o) => {
      const matchSearch =
        o.bankName.toLowerCase().includes(search.toLowerCase()) ||
        o.branchName.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search);
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">{list?.length ?? 0} total orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by bank, branch or order ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Bank</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr
                      className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedId === o.id
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground font-medium">#{o.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{o.bankName}</p>
                          <p className="text-xs text-muted-foreground">{o.branchName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">{formatRupee(o.total)}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{o.paymentMethod}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={o.status}
                          onValueChange={(status) => {
                            setUpdatingId(o.id);
                            updateStatus.mutate({ id: o.id, status });
                          }}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            {updatingId === o.id
                              ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
                              : <StatusBadge status={o.status} />}
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                <StatusBadge status={s} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr className="bg-muted/20 border-t border-dashed border-border">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Items</p>
                            <div className="space-y-1">
                              {o.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-foreground">{item.productName}</span>
                                  <span className="text-muted-foreground">
                                    {item.quantity} × {formatRupee(item.unitPrice)} = <span className="font-medium text-foreground">{formatRupee(item.totalPrice)}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-border text-xs space-y-1 text-muted-foreground">
                              <div className="flex justify-between"><span>Subtotal</span><span>{formatRupee(o.subtotal)}</span></div>
                              <div className="flex justify-between"><span>GST ({o.gstRate}%)</span><span>{formatRupee(o.gstAmount)}</span></div>
                              <div className="flex justify-between font-semibold text-foreground text-sm pt-1"><span>Total</span><span>{formatRupee(o.total)}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
