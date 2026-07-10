import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bank } from '@/lib/api';

type Role = 'bank' | 'admin' | null;

interface AuthContextType {
  token: string | null;
  role: Role;
  bank: Bank | null;
  adminUsername: string | null;
  isLoading: boolean;
  login: (token: string, role: Role, data?: { bank?: Bank; adminUsername?: string }) => void;
  logout: () => void;
  updateBank: (bank: Bank) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on init
    const storedToken = localStorage.getItem('bp_token');
    const storedRole = localStorage.getItem('bp_role') as Role;
    const storedBank = localStorage.getItem('bp_bank');
    const storedAdmin = localStorage.getItem('bp_admin');

    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      if (storedRole === 'bank' && storedBank) {
        try { setBank(JSON.parse(storedBank)); } catch (e) {}
      } else if (storedRole === 'admin' && storedAdmin) {
        setAdminUsername(storedAdmin);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newRole: Role, data?: { bank?: Bank; adminUsername?: string }) => {
    setToken(newToken);
    setRole(newRole);
    localStorage.setItem('bp_token', newToken);
    localStorage.setItem('bp_role', newRole || '');

    if (newRole === 'bank' && data?.bank) {
      setBank(data.bank);
      localStorage.setItem('bp_bank', JSON.stringify(data.bank));
      setAdminUsername(null);
      localStorage.removeItem('bp_admin');
    } else if (newRole === 'admin' && data?.adminUsername) {
      setAdminUsername(data.adminUsername);
      localStorage.setItem('bp_admin', data.adminUsername);
      setBank(null);
      localStorage.removeItem('bp_bank');
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setBank(null);
    setAdminUsername(null);
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_role');
    localStorage.removeItem('bp_bank');
    localStorage.removeItem('bp_admin');
  };

  // Refreshes the stored bank object after a profile edit, without touching
  // the token or forcing the bank to log in again.
  const updateBank = (updated: Bank) => {
    setBank(updated);
    localStorage.setItem('bp_bank', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ token, role, bank, adminUsername, isLoading, login, logout, updateBank }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
