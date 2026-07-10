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
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

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

// Fields still needed to complete registration after Google verifies the
// email — everything except email/password, since Google already proved
// ownership of the email and this account won't use password login.
const googleRegisterSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  gstNo: z.string().min(1, 'GST number is required'),
  panNo: z.string().min(1, 'PAN number is required'),
  address: z.string().min(1, 'Address is required'),
  mobile: z.string().min(10, 'Enter a valid mobile number'),
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

  // ── Google Sign-In state ──────────────────────────────────────────────
  // Set once Google returns "not registered" for this email, so we can
  // show the completion form and finish registration with the same idToken.
  const [googlePendingRegistration, setGooglePendingRegistration] = useState<{
    idToken: string;
    email: string;
    name: string;
  } | null>(null);

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

  // ── Google login ──────────────────────────────────────────────────────
  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) => auth.bankGoogleLogin(idToken),
    onSuccess: (data) => {
      login(data.token, data.role as any, { bank: data.bank });
      toast({ title: 'Welcome back', description: 'Successfully logged in with Google.' });
      setLocation('/dashboard');
    },
    onError: (err: any, idToken) => {
      // Backend returns 404 + { email, name } when this Google account
      // isn't linked to a bank yet — offer to complete registration.
      if (err?.status === 404 && err?.data?.email) {
        setGooglePendingRegistration({
          idToken,
          email: err.data.email,
          name: err.data.name || err.data.email,
        });
        return;
      }
      toast({ title: 'Google sign-in failed', description: err.message, variant: 'destructive' });
    },
  });

  // ── Google registration completion ───────────────────────────────────
  const googleRegisterForm = useForm<z.infer<typeof googleRegisterSchema>>({
    resolver: zodResolver(googleRegisterSchema),
    defaultValues: { bankName: '', branchName: '', gstNo: '', panNo: '', address: '', mobile: '' },
  });

  const googleRegisterMutation = useMutation({
    mutationFn: (data: z.infer<typeof googleRegisterSchema>) => {
      if (!googlePendingRegistration) throw new Error('Missing Google sign-in data');
      return auth.bankGoogleRegister(googlePendingRegistration.idToken, data);
    },
    onSuccess: (data) => {
      login(data.token, data.role as any, { bank: data.bank });
      toast({ title: 'Account created', description: 'Welcome to Bhavya Printers.' });
      setLocation('/dashboard');
    },
    onError: (err: Error) => {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
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

  // ── Complete registration after Google Sign-In found no existing bank ──
  if (googlePendingRegistration) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Complete Registration</h2>
            <p className="text-sm text-muted-foreground mt-2">
              No account found for <span className="font-medium text-foreground">{googlePendingRegistration.email}</span>.
              Fill in your branch details to finish setting up your account.
            </p>
          </div>

          <Form {...googleRegisterForm}>
            <form onSubmit={googleRegisterForm.handleSubmit((d) => googleRegisterMutation.mutate(d))} className="space-y-4">
              <FormField control={googleRegisterForm.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl><Input placeholder="State Bank of India" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={googleRegisterForm.control} name="branchName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl><Input placeholder="Bharuch" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={googleRegisterForm.control} name="gstNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST No.</FormLabel>
                    <FormControl><Input placeholder="22AAAAA0000A1Z5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={googleRegisterForm.control} name="panNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN No.</FormLabel>
                    <FormControl><Input placeholder="AAAAA0000A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={googleRegisterForm.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="Branch address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={googleRegisterForm.control} name="mobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={googleRegisterMutation.isPending}>
                {googleRegisterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish Registration
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setGooglePendingRegistration(null)}
              >
                Cancel
              </Button>
            </form>
          </Form>
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

        <div className="flex justify-center mb-6">
          <GoogleSignInButton
            text="signin_with"
            disabled={googleLoginMutation.isPending}
            onIdToken={(idToken) => googleLoginMutation.mutate(idToken)}
            onError={(message) => toast({ title: 'Google Sign-In error', description: message, variant: 'destructive' })}
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
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