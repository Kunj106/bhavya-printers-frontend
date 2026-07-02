import React from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({
  component: Component,
  role,
}: {
  component: React.ComponentType<any>;
  role?: 'bank' | 'admin';
}) {
  const { token, role: userRole, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!token) {
    return <Redirect to={role === 'admin' ? '/admin/login' : '/login'} />;
  }

  if (role && userRole !== role) {
    return <Redirect to={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
  }

  return <Component />;
}
