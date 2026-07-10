import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import {
  Moon,
  Sun,
  ShoppingCart,
  Menu,
  LogOut,
  Package,
  Users,
  Settings,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { role, logout, bank } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const isBank = role === 'bank';
  const isAdmin = role === 'admin';

  const NavLinks = () => (
    <>
      <Link href="/catalog" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/catalog' ? 'text-primary' : 'text-muted-foreground'}`}>
        Catalog
      </Link>
      
      {isBank && (
        <>
          <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}>
            My Orders
          </Link>
          <Link href="/orders/new" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/orders/new' ? 'text-primary' : 'text-muted-foreground'}`}>
            Place Order
          </Link>
          <Link href="/profile" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
            My Profile
          </Link>
        </>
      )}

      {isAdmin && (
        <>
          <Link href="/admin/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/admin/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            Dashboard
          </Link>
          <Link href="/admin/products" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/admin/products') ? 'text-primary' : 'text-muted-foreground'}`}>
            Products
          </Link>
          <Link href="/admin/banks" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/admin/banks') ? 'text-primary' : 'text-muted-foreground'}`}>
            Banks
          </Link>
          <Link
           href="/admin/orders"
           className={`text-sm font-medium transition-colors hover:text-primary ${
           location.startsWith('/admin/orders')
           ? 'text-primary'
           : 'text-muted-foreground'
          }`}
          >
          Orders
         </Link>
         <Link
         href="/admin/reports"
         className={`text-sm font-medium transition-colors hover:text-primary ${
         location.startsWith('/admin/reports')
          ? 'text-primary'
         : 'text-muted-foreground'
          }`}
           >
          Reports
         </Link>
         <Link
         href="/admin/settings"
          className={`text-sm font-medium transition-colors hover:text-primary ${
          location === '/admin/settings'
         ? 'text-primary'
         : 'text-muted-foreground'
         }`}
         >
         Settings
        </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-bold text-primary tracking-tight">Bhavya Printers</span>
            <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">Est. 1996 · Bharuch</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isBank && (
            <Link href="/orders/new">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-2">
            {!role ? (
              <>
                <Link href="/admin/login">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
                <div className="h-4 w-px bg-border" />
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            ) : (
              <Button variant="ghost" onClick={logout} className="gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-primary tracking-tight">Bhavya Printers</span>
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">Est. 1996 · Bharuch</span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    <NavLinks />
                  </nav>
                  <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-border">
                    {!role ? (
                      <>
                        <Link href="/login">
                          <Button variant="outline" className="w-full justify-start">Bank Login</Button>
                        </Link>
                        <Link href="/register">
                          <Button className="w-full justify-start">Register Bank</Button>
                        </Link>
                        <Link href="/admin/login">
                          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-primary">
                            <ShieldCheck className="h-4 w-4" />
                            Admin Login
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Button variant="ghost" onClick={logout} className="justify-start gap-2 text-muted-foreground hover:text-foreground">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}