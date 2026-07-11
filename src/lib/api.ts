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

/**
 * Like req(), but never throws on a non-ok response — instead returns the
 * status and parsed body so the caller can inspect them. Needed for
 * endpoints like /auth/bank/google, which return a 404 carrying useful
 * data (email, name) that a normal thrown Error would discard.
 */
async function reqCapture<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
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
    // leave json as {} — caller falls back to a generic message
  }
  return { ok: res.ok, status: res.status, data: json as T };
}

const get  = <T>(path: string)              => req<T>('GET',    path);
async function upload<T>(
  method: string,
  path: string,
  formData: FormData,
): Promise<T> {

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const text = await res.text();

  let json: Record<string, unknown> = {};

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  if (!res.ok) {
    throw new Error(
      String(json?.message ?? json?.error ?? `HTTP ${res.status}`)
    );
  }

  return json as T;
}
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

  /** Admin is a single whitelisted Google account (google.admin.email on the backend). */
  adminGoogleLogin:      (idToken: string) =>
    post<{ token: string; role: string }>('/auth/admin/google', { idToken }),

  bankLogin:             (email: string, password: string) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/login', { email, password }),

  bankRegister:          (data: BankRegisterInput) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/register', data),

  /**
   * Signs in an existing bank via Google. On success, returns the same
   * shape as bankLogin. If the Google account isn't linked to a bank yet,
   * throws an Error with `.status === 404` and `.data` containing
   * { error, email, name } from the backend — use these to route the user
   * into bankGoogleRegister.
   */
  bankGoogleLogin:       async (idToken: string) => {
    const { ok, status, data } = await reqCapture<{
      token?: string; role?: string; bank?: Bank;
      error?: string; email?: string; name?: string;
    }>('POST', '/auth/bank/google', { idToken });

    if (!ok) {
      const err: any = new Error(data?.error ?? `HTTP ${status}`);
      err.status = status;
      err.data = data;
      throw err;
    }
    return data as { token: string; role: string; bank: Bank };
  },

  /**
   * Completes registration for a bank whose Google account returned 404
   * from bankGoogleLogin. The email itself isn't sent — the backend
   * re-derives it from the same idToken so it can't be spoofed.
   */
  bankGoogleRegister:    (
    idToken: string,
    fields: {
      bankName: string;
      branchName: string;
      gstNo: string;
      panNo: string;
      address: string;
      mobile: string;
    }
  ) =>
    post<{ token: string; role: string; bank: Bank }>('/auth/bank/google-register', {
      idToken,
      ...fields,
    }),

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

  updateProfile: (id: number, data: BankProfileUpdateInput) =>
    put<Bank>(`/banks/${id}/profile`, data),

  updatePassword: (id: number, data: { currentPassword: string; newPassword: string }) =>
    put<{ message: string }>(`/banks/${id}/password`, data),
};

export interface BankProfileUpdateInput {
  address?: string;
  mobile?: string;
  email?: string;
  panNo?: string;
  gstNo?: string;
}

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
  dashboard: () => get<DashboardStats>('/analytics/dashboard'),

  revenue: () => get<MonthlyRevenue[]>('/analytics/revenue'),

  topBanks: () => get<TopBank[]>('/analytics/top-banks'),

  monthlyGst: () => get<OrderGst[]>('/analytics/monthly-gst'),
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = {

  get: () =>
    get<AppSettings>("/settings"),

  updateCredentials: (data: UpdateCredentials) =>
    put<{ message: string; adminUsername: string }>(
      "/settings/credentials",
      data
    ),

  /**
   * upiQrCode is a base64 data URL string, sent as plain JSON (not
   * multipart). Convert the selected File to base64 first — see
   * fileToBase64() in AdminSettings.tsx.
   */
  updateUpi: (data: { upiId: string; upiQrCode?: string }) =>
    put<{ upiId: string; upiQrCode: string; message: string }>(
      "/settings/upi",
      data
    ),

  updateAdminMobile: (adminMobile: string) =>
    put<{ message: string }>(
      "/settings/admin-mobile",
      {
        adminMobile,
      }
    ),

  updateGstRate: (gstRate: number) =>
    put<{ message: string; gstRate: number }>(
      "/settings/gst-rate",
      {
        gstRate,
      }
    ),

  /** image is a base64 data URL (e.g. "data:image/png;base64,..."). */
  updateLetterhead: (image: string) =>
    put<{ message: string }>("/settings/letterhead", { image }),

  /** image is a base64 data URL (e.g. "data:image/png;base64,..."). */
  updateSignature: (image: string) =>
    put<{ message: string }>("/settings/signature", { image }),
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

export interface OrderGst {
  orderId: number;
  orderDate: string;
  bankName: string;
  branchName: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  createdAt: string;
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
  letterheadImage?: string;
  signatureImage?: string;
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