// API service — connects to external Bhavya Printers Spring Boot backend
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (e.g. 502 HTML error page) — use raw text as message
    if (!res.ok) throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(
      String(json?.message ?? json?.error ?? `HTTP ${res.status}`)
    );
  }
  return json as T;
}

const get  = <T>(path: string)              => req<T>('GET',    path);
const post = <T>(path: string, body: unknown) => req<T>('POST',   path, body);
const put  = <T>(path: string, body: unknown) => req<T>('PUT',    path, body);
const del  = <T>(path: string)              => req<T>('DELETE', path);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  adminExists:           () =>
    get<{ exists: boolean }>('/auth/admin/exists'),

  adminLogin:            (username: string, password: string) =>
    post<{ token: string; role: string }>('/auth/admin/login', { username, password }),

  adminLoginByEmail:     (email: string, password: string) =>
    post<{ token: string; role: string }>('/auth/admin/login', { username: email, password }),

  adminRegister:         (username: string, password: string, email: string) =>
    post<{ token: string; role: string }>('/auth/admin/register', { username, password, email, confirmPassword: password }),

  adminForgotSendOtp:    (email: string) =>
    post<{ message: string }>('/auth/admin/forgot-password/send-otp', { email }),

  adminForgotVerifyOtp:  (email: string, otp: string) =>
    post<{ message: string }>('/auth/admin/forgot-password/verify-otp', { email, otp }),

  adminForgotReset:      (email: string, newPassword: string) =>
    post<{ message: string }>('/auth/admin/forgot-password/reset-password', { email, password: newPassword }),

  bankLogin:             (email: string, password: string) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/login', { email, password }),

  bankRegister:          (data: BankRegisterInput) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/register', data),

  sendLoginOtp:          (email: string) =>
    post<{ message: string }>('/auth/bank/send-otp', { email }),

  verifyLoginOtp:        (email: string, otp: string) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/verify-otp', { email, otp }),

  forgotSendOtp:         (email: string) =>
    post<{ message: string }>('/auth/bank/forgot-password/send-otp', { email }),

  forgotVerifyOtp:       (email: string, otp: string) =>
    post<{ message: string }>('/auth/bank/forgot-password/verify-otp', { email, otp }),

  forgotResetPassword:   (email: string, password: string) =>
    post<{ message: string }>('/auth/bank/forgot-password/reset-password', { email, password }),
};

// ─── Products ────────────────────────────────────────────────────────────────

export const products = {
  list:   ()                        => get<Product[]>('/products'),
  get:    (id: number)              => get<Product>(`/products/${id}`),
  create: (data: ProductInput)      => post<Product>('/products', data),
  update: (id: number, data: Partial<ProductInput>) => put<Product>(`/products/${id}`, data),
  delete: (id: number)              => del<{ message: string }>(`/products/${id}`),
};

// ─── Banks ───────────────────────────────────────────────────────────────────

export const banks = {
  list:   ()           => get<Bank[]>('/banks'),
  get:    (id: number) => get<Bank>(`/banks/${id}`),
  delete: (id: number) => del<{ message: string }>(`/banks/${id}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = {
  list:          ()                             => get<Order[]>('/orders'),
  get:           (id: number)                   => get<Order>(`/orders/${id}`),
  create:        (data: OrderInput)             => post<Order>('/orders', data),
  updateStatus:  (id: number, status: string)   => put<Order>(`/orders/${id}/status`, { status }),
  byBank:        (bankId: number)               => get<Order[]>(`/orders/bank/${bankId}`),
};

// ─── Payments (Razorpay) ─────────────────────────────────────────────────────

export const payments = {
  // Step 1: ask backend to create a Razorpay order tied to our internal order.
  createPaymentOrder: (orderId: number) =>
    post<CreatePaymentOrderResponse>(`/payments/create/${orderId}`, {}),

  // Step 2: after Razorpay Checkout succeeds client-side, verify server-side.
  verifyPayment: (data: VerifyPaymentInput) =>
    post<{ message: string }>('/payments/verify', data),

  // Admin-only: manually mark a Pay-after-Delivery (COD) order as paid.
  markPaidManually: (orderId: number) =>
    put<{ message: string }>(`/payments/${orderId}/mark-paid`, {}),
};

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentInput {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analytics = {
  dashboard:    () => get<DashboardStats>('/analytics/dashboard'),
  revenue:      () => get<MonthlyRevenue[]>('/analytics/revenue'),
  topBanks:     () => get<TopBank[]>('/analytics/top-banks'),
  monthlyGst:   () => get<MonthlyGst[]>('/analytics/monthly-gst'),
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = {
  get:                ()                          => get<AppSettings>('/settings'),
  updateCredentials:  (data: UpdateCredentials)   => put<{ message: string; adminUsername: string }>('/settings/credentials', data),
  updateUpi:          (upiId: string, upiQrCode?: string) => put<{ message: string }>('/settings/upi', { upiId, upiQrCode }),
  updateAdminMobile:  (adminMobile: string)       => put<{ message: string }>('/settings/admin-mobile', { adminMobile }),
  updateGstRate:      (gstRate: number)           => put<{ message: string; gstRate: number }>('/settings/gst-rate', { gstRate }),
};

// ─── Health ──────────────────────────────────────────────────────────────────

export const health = {
  check: () => get<{ status: string }>('/healthz'),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Bank {
  id: number;
  bankName: string;
  branchName: string;
  gstNo: string;
  panNo: string;
  address: string;
  mobile: string;
  email: string;
  createdAt: string;
}

export interface BankRegisterInput {
  bankName: string;
  branchName: string;
  gstNo: string;
  panNo: string;
  address: string;
  mobile: string;
  email: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  bankId: number;
  bankName: string;
  branchName: string;
  gstNo: string;
  panNo: string;
  address: string;
  mobile: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  paymentMethod: string; // 'UPI' | 'NETBANKING' | 'COD'
  upiId?: string;
  status: string;
  paymentStatus: string; // 'Pending' | 'Paid' | 'Failed'
  bankCode?: string;
  createdAt: string;
}

export interface OrderInput {
  bankId?: number;
  bankName: string;
  branchName: string;
  gstNo: string;
  panNo: string;
  address: string;
  mobile: string;
  email: string;
  items: { productId: number; quantity: number }[];
  gstRate: number;
  paymentMethod: string;
  upiId?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalBanks: number;
  totalProducts: number;
  deliveredOrders: number;
  thisMonthRevenue: number;
  pendingOrders: number;
  thisMonthOrders: number;
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  totalRevenue: number;
  orderCount: number;
  gstCollected: number;
}

export interface MonthlyGst {
  month: number;
  year: number;
  taxableAmount: number;
  gst12Amount: number;
  gst18Amount: number;
  totalGst: number;
  orderCount: number;
}

export interface TopBank {
  bankId: number;
  bankName: string;
  branchName: string;
  orderCount: number;
  totalSpend: number;
}

export interface AppSettings {
  upiId: string;
  adminMobile: string;
  upiQrCode?: string;
  otpEnabled: boolean;
  adminUsername: string;
  gstRate: number;
}

export interface UpdateCredentials {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

// Month name helper
export const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];