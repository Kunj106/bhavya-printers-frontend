import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import AdminReports from '@/pages/admin/AdminReports';

// Public pages
import Landing from '@/pages/Landing';
import Catalog from '@/pages/Catalog';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Bank pages
import Dashboard from '@/pages/bank/Dashboard';
import PlaceOrder from '@/pages/bank/PlaceOrder';
import OrderDetail from '@/pages/bank/OrderDetail';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminBanks from '@/pages/admin/AdminBanks';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReports from '@/pages/admin/AdminReports';
import AdminGstReport from '@/pages/admin/AdminGstReport';
import AdminSettings from '@/pages/admin/AdminSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          {/* Public */}
          <Route path="/" component={Landing} />
          <Route path="/catalog" component={Catalog} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/register" component={AdminRegister} />

          {/* Bank protected */}
          <Route path="/dashboard">
            <ProtectedRoute role="bank" component={Dashboard} />
          </Route>
          <Route path="/orders/new">
            <ProtectedRoute role="bank" component={PlaceOrder} />
          </Route>
          <Route path="/orders/:id">
            <ProtectedRoute role="bank" component={OrderDetail} />
          </Route>

          {/* Admin protected */}
          <Route path="/admin/dashboard">
            <ProtectedRoute role="admin" component={AdminDashboard} />
          </Route>
          <Route path="/admin/products">
            <ProtectedRoute role="admin" component={AdminProducts} />
          </Route>
          <Route path="/admin/banks">
            <ProtectedRoute role="admin" component={AdminBanks} />
          </Route>
          <Route path="/admin/orders">
            <ProtectedRoute role="admin" component={AdminOrders} />
          </Route>
          <Route path="/admin/reports">
          <ProtectedRoute role="admin" component={AdminReports} />
          </Route>
          <Route path="/admin/reports/gst">
          <ProtectedRoute role="admin" component={AdminGstReport} />
          </Route>
          <Route path="/admin/settings">
            <ProtectedRoute role="admin" component={AdminSettings} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
