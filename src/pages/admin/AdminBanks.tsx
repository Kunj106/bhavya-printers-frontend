import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banks } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, Building2, Search, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBanks() {
  const { data: list, isLoading } = useQuery({ queryKey: ['banks'], queryFn: banks.list });
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => banks.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banks'] });
      toast({ title: 'Bank deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const filtered = (list ?? []).filter(
    (b) =>
      b.bankName.toLowerCase().includes(search.toLowerCase()) ||
      b.branchName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.gstNo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banks</h1>
        <p className="text-muted-foreground mt-1">
          {list?.length ?? 0} registered banking clients
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by bank, branch, email or GST..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{search ? 'No banks match your search.' : 'No banks registered yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bank</th>
                  <th className="px-4 py-3 font-semibold">GST / PAN</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{b.bankName}</p>
                        <p className="text-xs text-muted-foreground">{b.branchName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-mono text-xs text-foreground">{b.gstNo}</p>
                        <p className="font-mono text-xs text-muted-foreground">{b.panNo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />{b.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{b.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate text-xs">{b.address}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {b.createdAt ? format(new Date(b.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Delete "${b.bankName} – ${b.branchName}"? This cannot be undone.`))
                            deleteMutation.mutate(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
