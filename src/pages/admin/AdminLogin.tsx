import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { auth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

// ── Schemas ──────────────────────────────────────────────────────────────────

const usernameSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const emailSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const fpEmailSchema = z.object({
  email: z.string().email('Valid email is required'),
});

const fpOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Enter the 6-digit OTP')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});

const fpResetSchema = z
  .object({
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

// ── Step types ────────────────────────────────────────────────────────────────
type FPStep = 0 | 1 | 2 | 3 | 4;
// 0 = normal login
// 1 = enter email
// 2 = enter OTP
// 3 = new password
// 4 = success

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [fpStep, setFpStep] = useState<FPStep>(0);
  const [fpEmail, setFpEmail] = useState('');

  // ── Username login form ──────────────────────────────────────────────────
  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '', password: '' },
  });

  const usernameMutation = useMutation({
    mutationFn: (d: z.infer<typeof usernameSchema>) =>
      auth.adminLogin(d.username, d.password),
    onSuccess: (data) => {
      login(data.token, 'admin', { adminUsername: data.role });
      toast({ title: 'Welcome, Admin', description: 'You are now logged in.' });
      setLocation('/admin/dashboard');
    },
    onError: (err: Error) =>
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' }),
  });

  // ── Email login form ─────────────────────────────────────────────────────
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const emailMutation = useMutation({
    mutationFn: (d: z.infer<typeof emailSchema>) =>
      auth.adminLoginByEmail(d.email, d.password),
    onSuccess: (data) => {
      login(data.token, 'admin', { adminUsername: data.role });
      toast({ title: 'Welcome, Admin', description: 'You are now logged in.' });
      setLocation('/admin/dashboard');
    },
    onError: (err: Error) =>
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' }),
  });

  // ── Forgot password — step 1: send OTP ───────────────────────────────────
  const fpEmailForm = useForm<z.infer<typeof fpEmailSchema>>({
    resolver: zodResolver(fpEmailSchema),
    defaultValues: { email: '' },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (d: z.infer<typeof fpEmailSchema>) => {
      setFpEmail(d.email);
      return auth.adminForgotSendOtp(d.email);
    },
    onSuccess: (_data, variables) => {
      toast({ title: 'OTP sent', description: `Check the inbox for ${variables.email}.` });
      fpOtpForm.reset();
      setFpStep(2);
    },
    onError: (err: Error) =>
      toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  // ── Forgot password — step 2: verify OTP ─────────────────────────────────
  const fpOtpForm = useForm<z.infer<typeof fpOtpSchema>>({
    resolver: zodResolver(fpOtpSchema),
    defaultValues: { otp: '' },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (d: z.infer<typeof fpOtpSchema>) =>
      auth.adminForgotVerifyOtp(fpEmail, d.otp),
    onSuccess: () => setFpStep(3),
    onError: (err: Error) =>
      toast({ title: 'Invalid OTP', description: err.message, variant: 'destructive' }),
  });

  // ── Forgot password — step 3: reset password ──────────────────────────────
  const fpResetForm = useForm<z.infer<typeof fpResetSchema>>({
    resolver: zodResolver(fpResetSchema),
    defaultValues: { newPassword: '', confirm: '' },
  });

  const resetMutation = useMutation({
    mutationFn: (d: z.infer<typeof fpResetSchema>) =>
      auth.adminForgotReset(fpEmail, d.newPassword),
    onSuccess: () => setFpStep(4),
    onError: (err: Error) =>
      toast({ title: 'Reset failed', description: err.message, variant: 'destructive' }),
  });

  // ── Forgot-password UI ────────────────────────────────────────────────────
  if (fpStep !== 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin — Reset Password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {fpStep === 1 && 'Enter your admin email address'}
              {fpStep === 2 && `OTP sent to ${fpEmail}`}
              {fpStep === 3 && 'Choose a new password'}
              {fpStep === 4 && 'Password updated successfully'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
            {/* Step 1 — email */}
            {fpStep === 1 && (
              <Form {...fpEmailForm}>
                <form
                  onSubmit={fpEmailForm.handleSubmit((d) => sendOtpMutation.mutate(d))}
                  className="space-y-5"
                >
                  <FormField
                    control={fpEmailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@bhavyaprinters.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send OTP
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2 — OTP */}
            {fpStep === 2 && (
              <Form {...fpOtpForm}>
                <form
                  onSubmit={fpOtpForm.handleSubmit((d) => verifyOtpMutation.mutate(d))}
                  className="space-y-5"
                >
                  <FormField
                    control={fpOtpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-digit OTP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123456"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify OTP
                  </Button>
                  <button
                    type="button"
                    onClick={() => sendOtpMutation.mutate({ email: fpEmail })}
                    className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
                    disabled={sendOtpMutation.isPending}
                  >
                    Didn't receive it? Resend OTP
                  </button>
                </form>
              </Form>
            )}

            {/* Step 3 — new password */}
            {fpStep === 3 && (
              <Form {...fpResetForm}>
                <form
                  onSubmit={fpResetForm.handleSubmit((d) => resetMutation.mutate(d))}
                  className="space-y-5"
                >
                  <FormField
                    control={fpResetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fpResetForm.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reset Password
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 4 — success */}
            {fpStep === 4 && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <p className="text-foreground font-medium">Password reset successfully!</p>
                <Button className="w-full" size="lg" onClick={() => setFpStep(0)}>
                  Back to Login
                </Button>
              </div>
            )}
          </div>

          {fpStep !== 4 && (
            <button
              type="button"
              onClick={() => setFpStep(0)}
              className="mt-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Normal login UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Bhavya Printers Administration</p>
        </div>

        {/* Tabs: Username / Email */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <Tabs defaultValue="username" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="username">Username</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            {/* ── Username tab ── */}
            <TabsContent value="username">
              <Form {...usernameForm}>
                <form
                  onSubmit={usernameForm.handleSubmit((d) => usernameMutation.mutate(d))}
                  className="space-y-5"
                >
                  <FormField
                    control={usernameForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="admin"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={usernameForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFpStep(1);
                        fpEmailForm.reset();
                        fpOtpForm.reset();
                        fpResetForm.reset();
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={usernameMutation.isPending}
                  >
                    {usernameMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* ── Email tab ── */}
            <TabsContent value="email">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit((d) => emailMutation.mutate(d))}
                  className="space-y-5"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@bhavyaprinters.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFpStep(1);
                        fpEmailForm.reset();
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={emailMutation.isPending}
                  >
                    {emailMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          No admin account yet?{' '}
          <a href="/admin/register" className="text-primary hover:underline font-medium">
            Register here
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Bhavya Printers &mdash; Internal Administration System
        </p>
      </div>
    </div>
  );
}