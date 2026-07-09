import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { auth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().optional(),
  newPassword: z.string().optional(),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('password');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<0 | 1 | 2 | 3>(0);
  // 0 = no forgot password, 1 = enter email, 2 = enter otp, 3 = enter new password

  const [otpEmail, setOtpEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Password Login
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: z.infer<typeof passwordSchema>) => auth.bankLogin(data.email, data.password),
    onSuccess: (data) => {
      login(data.token, data.role as any, { bank: data.bank });
      toast({ title: 'Welcome back', description: 'Successfully logged in.' });
      setLocation('/dashboard');
    },
    onError: (err: Error) => {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    },
  });

  // OTP Request
  const otpRequestForm = useForm({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email: '' },
  });

  const otpRequestMutation = useMutation({
    mutationFn: (data: z.infer<typeof otpRequestSchema>) => auth.sendLoginOtp(data.email),
    onSuccess: (_, variables) => {
      setOtpEmail(variables.email);
      toast({ title: 'OTP Sent', description: 'Please check your email for the verification code.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to send OTP', description: err.message, variant: 'destructive' });
    },
  });

  // OTP Verify
  const otpVerifyForm = useForm({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otp: '' },
  });

  const otpVerifyMutation = useMutation({
    mutationFn: (data: z.infer<typeof otpVerifySchema>) => auth.verifyLoginOtp(otpEmail, data.otp),
    onSuccess: (data) => {
      login(data.token, data.role as any, { bank: data.bank });
      toast({ title: 'Welcome back', description: 'Successfully logged in.' });
      setLocation('/dashboard');
    },
    onError: (err: Error) => {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    },
  });

  // Forgot Password forms
  const forgotEmailForm = useForm({ defaultValues: { email: '' } });
  const forgotOtpForm = useForm({ defaultValues: { otp: '' } });
  const forgotResetForm = useForm({ defaultValues: { newPassword: '' } });

  const forgotSendMutation = useMutation({
    mutationFn: (email: string) => auth.forgotSendOtp(email),
    onSuccess: (_, email) => {
      setForgotEmail(email);
      setForgotPasswordStep(2);
      toast({ title: 'Recovery OTP Sent', description: 'Check your email.' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const forgotVerifyMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string, otp: string }) => auth.forgotVerifyOtp(email, otp),
    onSuccess: () => {
      setForgotPasswordStep(3);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const forgotResetMutation = useMutation({
    mutationFn: ({ email, password }: { email: string, password: string }) => auth.forgotResetPassword(email, password),
    onSuccess: () => {
      setForgotPasswordStep(0);
      toast({ title: 'Password Reset', description: 'You can now log in with your new password.' });
      setActiveTab('password');
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (forgotPasswordStep > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Recover Password</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Follow the steps to reset your bank account password
            </p>
          </div>

          {forgotPasswordStep === 1 && (
            <Form {...forgotEmailForm}>
              <form onSubmit={forgotEmailForm.handleSubmit((data) => forgotSendMutation.mutate(data.email))} className="space-y-4">
                <FormField control={forgotEmailForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered Email</FormLabel>
                    <FormControl><Input placeholder="officer@bank.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={forgotSendMutation.isPending}>
                  {forgotSendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Recovery OTP
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotPasswordStep(0)}>
                  Cancel
                </Button>
              </form>
            </Form>
          )}

          {forgotPasswordStep === 2 && (
            <Form {...forgotOtpForm}>
              <form onSubmit={forgotOtpForm.handleSubmit((data) => forgotVerifyMutation.mutate({ email: forgotEmail, otp: data.otp }))} className="space-y-4">
                <p className="text-sm text-center text-muted-foreground mb-4">OTP sent to {forgotEmail}</p>
                <FormField control={forgotOtpForm.control} name="otp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit OTP</FormLabel>
                    <FormControl><Input placeholder="XXXXXX" maxLength={6} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={forgotVerifyMutation.isPending}>
                  {forgotVerifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify OTP
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotPasswordStep(0)}>
                  Cancel
                </Button>
              </form>
            </Form>
          )}

          {forgotPasswordStep === 3 && (
            <Form {...forgotResetForm}>
              <form onSubmit={forgotResetForm.handleSubmit((data) => forgotResetMutation.mutate({ email: forgotEmail, password: data.newPassword }))} className="space-y-4">
                <FormField control={forgotResetForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={forgotResetMutation.isPending}>
                  {forgotResetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Bank Login</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Access your branch's ordering dashboard
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">OTP Login</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
                <FormField control={passwordForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input placeholder="officer@bank.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Secure Login
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="otp">
            {!otpEmail ? (
              <Form {...otpRequestForm}>
                <form onSubmit={otpRequestForm.handleSubmit((d) => otpRequestMutation.mutate(d))} className="space-y-4">
                  <FormField control={otpRequestForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input placeholder="officer@bank.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={otpRequestMutation.isPending}>
                    {otpRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send OTP to Email
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...otpVerifyForm}>
                <form onSubmit={otpVerifyForm.handleSubmit((d) => otpVerifyMutation.mutate(d))} className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">
                    Code sent to <span className="font-medium text-foreground">{otpEmail}</span>
                  </p>
                  <FormField control={otpVerifyForm.control} name="otp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>6-Digit OTP</FormLabel>
                      <FormControl><Input placeholder="XXXXXX" maxLength={6} className="text-center tracking-widest text-lg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={otpVerifyMutation.isPending}>
                    {otpVerifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Login
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpEmail('')}>
                    Change Email
                  </Button>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t flex flex-col items-center gap-4 text-sm">
          <button onClick={() => setForgotPasswordStep(1)} className="text-primary hover:underline font-medium">
            Forgot Password?
          </button>
          <div className="text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Register your branch</Link>
          </div>
          <div className="text-muted-foreground/60 text-xs pt-1 border-t border-border/40 w-full text-center">
            Bhavya Printers staff?{' '}
            <Link href="/admin/login" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}