import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { banks } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  mobile: z.string().min(10, 'Enter a valid mobile number'),
  email: z.string().email('Enter a valid email'),
  panNo: z.string().min(1, 'PAN number is required'),
  gstNo: z.string().min(1, 'GST number is required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function BankProfile() {
  const { bank, updateBank } = useAuth();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      address: bank?.address ?? '',
      mobile: bank?.mobile ?? '',
      email: bank?.email ?? '',
      panNo: bank?.panNo ?? '',
      gstNo: bank?.gstNo ?? '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: (d: ProfileFormData) => banks.updateProfile(bank!.id, d),
    onSuccess: (updated) => {
      updateBank(updated);
      toast({ title: 'Profile updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const passwordMutation = useMutation({
    mutationFn: (d: PasswordFormData) =>
      banks.updatePassword(bank!.id, { currentPassword: d.currentPassword, newPassword: d.newPassword }),
    onSuccess: () => {
      toast({ title: 'Password changed successfully' });
      passwordForm.reset();
    },
    onError: (e: Error) => toast({ title: 'Password change failed', description: e.message, variant: 'destructive' }),
  });

  if (!bank) return null;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Update your branch details and account security</p>
      </div>

      {/* Profile details */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Branch Details</h2>
        </div>

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="panNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={profileForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complete Delivery Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={profileMutation.isPending}>
              {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>

      {/* Change password */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Change Password</h2>
        </div>

        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4 max-w-sm">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}