import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, CreditCard, ShieldCheck, Phone, Receipt } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const upiSchema = z.object({
  upiId: z.string().min(1, 'UPI ID is required'),
  upiQrCode: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const credSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newUsername: z.string().optional(),
  newPassword: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

const mobileSchema = z.object({ adminMobile: z.string() });

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { data: cfg, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settings.get });
  const qc = useQueryClient();
  const { toast } = useToast();

  const upiForm = useForm<z.infer<typeof upiSchema>>({
    resolver: zodResolver(upiSchema),
    defaultValues: { upiId: '', upiQrCode: '' },
  });

  const credForm = useForm<z.infer<typeof credSchema>>({
    resolver: zodResolver(credSchema),
    defaultValues: { currentPassword: '', newUsername: '', newPassword: '' },
  });

  const mobileForm = useForm<z.infer<typeof mobileSchema>>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { adminMobile: '' },
  });

  const [gstRate, setGstRate] = React.useState<12 | 18>(18);

  useEffect(() => {
    if (cfg) {
      upiForm.reset({ upiId: cfg.upiId ?? '', upiQrCode: cfg.upiQrCode ?? '' });
      mobileForm.reset({ adminMobile: cfg.adminMobile ?? '' });
      setGstRate(cfg.gstRate === 12 ? 12 : 18);
    }
  }, [cfg]);

  const updateUpi = useMutation({
    mutationFn: (d: z.infer<typeof upiSchema>) => settings.updateUpi(d.upiId, d.upiQrCode || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'UPI settings saved' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateCred = useMutation({
    mutationFn: (d: z.infer<typeof credSchema>) =>
      settings.updateCredentials({ currentPassword: d.currentPassword, newUsername: d.newUsername || undefined, newPassword: d.newPassword || undefined }),
    onSuccess: () => { credForm.reset(); toast({ title: 'Credentials updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMobile = useMutation({
    mutationFn: (d: z.infer<typeof mobileSchema>) => settings.updateAdminMobile(d.adminMobile),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'Mobile number saved' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateGst = useMutation({
    mutationFn: (rate: number) => settings.updateGstRate(rate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'GST rate updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure Bhavya Printers portal settings</p>
      </div>

      {/* UPI Settings */}
      <SectionCard icon={<CreditCard className="h-5 w-5" />} title="UPI Payment Settings">
        <Form {...upiForm}>
          <form onSubmit={upiForm.handleSubmit((d) => updateUpi.mutate(d))} className="space-y-4">
            <FormField control={upiForm.control} name="upiId" render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID</FormLabel>
                <FormControl><Input placeholder="bhavyaprinters@upi" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={upiForm.control} name="upiQrCode" render={({ field }) => (
              <FormItem>
                <FormLabel>QR Code Image URL (optional)</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={updateUpi.isPending}>
              {updateUpi.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save UPI Settings
            </Button>
          </form>
        </Form>
      </SectionCard>

      {/* Admin Credentials */}
      <SectionCard icon={<ShieldCheck className="h-5 w-5" />} title="Admin Credentials">
        <Form {...credForm}>
          <form onSubmit={credForm.handleSubmit((d) => updateCred.mutate(d))} className="space-y-4">
            <FormField control={credForm.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={credForm.control} name="newUsername" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Username (optional)</FormLabel>
                  <FormControl><Input placeholder="admin" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={credForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (optional)</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <p className="text-xs text-muted-foreground">Leave new username/password blank to keep current values.</p>
            <Button type="submit" disabled={updateCred.isPending}>
              {updateCred.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Credentials
            </Button>
          </form>
        </Form>
      </SectionCard>

      {/* Admin Mobile */}
      <SectionCard icon={<Phone className="h-5 w-5" />} title="Admin Contact Number">
        <Form {...mobileForm}>
          <form onSubmit={mobileForm.handleSubmit((d) => updateMobile.mutate(d))} className="space-y-4">
            <FormField control={mobileForm.control} name="adminMobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl><Input placeholder="9876543210" maxLength={10} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={updateMobile.isPending}>
              {updateMobile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Mobile
            </Button>
          </form>
        </Form>
      </SectionCard>

      {/* GST Rate */}
      <SectionCard icon={<Receipt className="h-5 w-5" />} title="GST Rate">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select the applicable GST rate for all orders.</p>
          <div className="flex gap-4">
            {([12, 18] as const).map((rate) => (
              <label
                key={rate}
                className={`flex items-center gap-3 cursor-pointer rounded-xl border p-4 flex-1 transition-all ${
                  gstRate === rate ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="gstRate"
                  value={rate}
                  checked={gstRate === rate}
                  onChange={() => setGstRate(rate)}
                  className="accent-primary"
                />
                <div>
                  <p className="font-semibold text-foreground">{rate}% GST</p>
                  <p className="text-xs text-muted-foreground">{rate === 12 ? 'Standard rate' : 'Higher rate'}</p>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={() => updateGst.mutate(gstRate)} disabled={updateGst.isPending || gstRate === cfg?.gstRate}>
            {updateGst.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save GST Rate
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
