import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { products, orders, settings, payments, OrderInput } from '@/lib/api';
import { formatRupee } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Minus, ShoppingCart, CheckCircle, ChevronRight, Landmark, Truck } from 'lucide-react';

type CartItem = { productId: number; name: string; price: number; quantity: number };
type PaymentMethod = 'upi' | 'netbanking' | 'cod';
type NetbankingBank = 'SBI' | 'BOB';

const STEPS = ['Select Products', 'Review Details', 'Payment'];

// Loads the Razorpay Checkout script once, on demand.
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PlaceOrder() {
  const { bank } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [netbankingBank, setNetbankingBank] = useState<NetbankingBank>('SBI');
  const [processingPayment, setProcessingPayment] = useState(false);

  const { data: productList, isLoading: prodLoading } = useQuery({ queryKey: ['products'], queryFn: products.list });
  const { data: appSettings } = useQuery({ queryKey: ['settings'], queryFn: settings.get });

  const gstRate = appSettings?.gstRate ?? 18;
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const total = subtotal + gstAmount;

  const setQty = (productId: number, name: string, price: number, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((i) => i.productId !== productId));
    } else {
      setCart((c) => {
        const existing = c.find((i) => i.productId === productId);
        if (existing) return c.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i));
        return [...c, { productId, name, price, quantity: qty }];
      });
    }
  };

  const getQty = (productId: number) => cart.find((i) => i.productId === productId)?.quantity ?? 0;

  const createMutation = useMutation({
    mutationFn: (input: OrderInput) => orders.create(input),
    onError: (e: Error) => toast({ title: 'Failed to place order', description: e.message, variant: 'destructive' }),
  });

  // ── Pay after Delivery: no gateway involved, order goes straight through. ──
  const submitCodOrder = () => {
    if (!bank) return;
    createMutation.mutate(
      {
        bankId: bank.id,
        bankName: bank.bankName,
        branchName: bank.branchName,
        gstNo: bank.gstNo,
        panNo: bank.panNo,
        address: bank.address,
        mobile: bank.mobile,
        email: bank.email,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        gstRate,
        paymentMethod: 'COD',
      },
      {
        onSuccess: (order) => {
          toast({ title: 'Order placed successfully!', description: `Order #${order.id} — pay on delivery.` });
          setLocation(`/orders/${order.id}?payment=cod`);
        },
      }
    );
  };

  // ── UPI / Netbanking: create order first, then open Razorpay Checkout. ──
  const submitGatewayOrder = async () => {
    if (!bank) return;
    setProcessingPayment(true);

    try {
      const order = await new Promise<Awaited<ReturnType<typeof orders.create>>>((resolve, reject) => {
        createMutation.mutate(
          {
            bankId: bank.id,
            bankName: bank.bankName,
            branchName: bank.branchName,
            gstNo: bank.gstNo,
            panNo: bank.panNo,
            address: bank.address,
            mobile: bank.mobile,
            email: bank.email,
            items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            gstRate,
            paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'NETBANKING',
            upiId: paymentMethod === 'upi' ? appSettings?.upiId : undefined,
          },
          { onSuccess: resolve, onError: reject }
        );
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({ title: 'Could not load payment gateway', description: 'Check your internet connection and try again.', variant: 'destructive' });
        setProcessingPayment(false);
        setLocation(`/orders/${order.id}?payment=failed`);
        return;
      }

      const paymentOrder = await payments.createPaymentOrder(order.id);

      const options: any = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Bhavya Printers',
        description: `Order #${order.id}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: bank.bankName,
          email: bank.email,
          contact: bank.mobile,
        },
        // Preselect the payment method / bank the user picked, while letting
        // Razorpay's own Checkout UI handle the actual redirect + login.
        method: paymentMethod === 'upi' ? { upi: true } : { netbanking: true },
        ...(paymentMethod === 'netbanking' && {
          // NOTE: confirm these bank codes in your Razorpay Dashboard —
          // Settings → Payment Methods → Netbanking, since exact codes
          // can vary. SBIN = State Bank of India is standard; Bank of
          // Baroda's code should be verified there before going live.
          prefill: {
            name: bank.bankName,
            email: bank.email,
            contact: bank.mobile,
            bank: netbankingBank === 'SBI' ? 'SBIN' : 'BARB_R',
          },
        }),
        handler: async (response: any) => {
          try {
            await payments.verifyPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast({ title: 'Payment successful!', description: `Order #${order.id} is confirmed.` });
            setLocation(`/orders/${order.id}?payment=success`);
          } catch (e) {
            toast({ title: 'Payment verification failed', description: 'Please contact support if the amount was deducted.', variant: 'destructive' });
            setLocation(`/orders/${order.id}?payment=failed`);
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            toast({ title: 'Payment cancelled', description: 'You can retry payment from your order page.', variant: 'destructive' });
            setLocation(`/orders/${order.id}?payment=failed`);
          },
        },
        theme: { color: '#f59e0b' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', () => {
        setProcessingPayment(false);
        toast({ title: 'Payment failed', description: 'Please try again.', variant: 'destructive' });
        setLocation(`/orders/${order.id}?payment=failed`);
      });
      rzp.open();
    } catch (e) {
      setProcessingPayment(false);
      // createMutation's onError already toasts for order-creation failures.
    }
  };

  const submitOrder = () => {
    if (paymentMethod === 'cod') {
      submitCodOrder();
    } else {
      submitGatewayOrder();
    }
  };

  const isSubmitting = createMutation.isPending || processingPayment;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Place New Order</h1>
        <p className="text-muted-foreground mt-1">Select stationery products for your branch</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-medium ${i === step ? 'text-primary' : i < step ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < step ? 'border-emerald-500 bg-emerald-500 text-white' :
                i === step ? 'border-primary text-primary' : 'border-muted-foreground/40 text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Products */}
      {step === 0 && (
        <div className="space-y-6">
          {prodLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(productList ?? []).map((p) => {
                const qty = getQty(p.id);
                return (
                  <div key={p.id} className={`bg-card border rounded-xl p-5 transition-all duration-200 ${qty > 0 ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-foreground leading-tight">{p.name}</p>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20 mt-1">
                          {p.category}
                        </span>
                      </div>
                      <p className="font-bold text-foreground text-sm whitespace-nowrap">{formatRupee(p.price)}</p>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-auto">
                      {qty === 0 ? (
                        <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setQty(p.id, p.name, p.price, 1)}>
                          <Plus className="h-4 w-4" /> Add to Order
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(p.id, p.name, p.price, qty - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(p.id, p.name, p.price, parseInt(e.target.value) || 0)}
                            className="h-8 w-16 text-center"
                          />
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(p.id, p.name, p.price, qty + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="sticky bottom-4 bg-card border border-primary/30 rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
                  <p className="text-xs text-muted-foreground">Subtotal: {formatRupee(subtotal)}</p>
                </div>
              </div>
              <Button onClick={() => setStep(1)}>Review Order</Button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Bank Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Bank Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Bank Name', bank?.bankName], ['Branch', bank?.branchName],
                ['GST No', bank?.gstNo], ['PAN No', bank?.panNo],
                ['Email', bank?.email], ['Mobile', bank?.mobile],
                ['Address', bank?.address],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.quantity} × {formatRupee(item.price)} = <span className="font-semibold text-foreground">{formatRupee(item.price * item.quantity)}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatRupee(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>GST ({gstRate}%)</span><span>{formatRupee(gstAmount)}</span></div>
              <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border"><span>Total</span><span>{formatRupee(total)}</span></div>
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)}>Continue to Payment</Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">

              {/* UPI */}
              <label className={`flex items-start gap-4 cursor-pointer rounded-xl border p-4 transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="accent-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">UPI Payment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">GPay, PhonePe, Paytm, BHIM &mdash; pay to {appSettings?.upiId ?? '—'}</p>
                  {paymentMethod === 'upi' && appSettings?.upiQrCode && (
                    <div className="mt-3">
                      <img src={appSettings.upiQrCode} alt="UPI QR Code" className="rounded-lg border border-border h-40 w-40 object-contain bg-white p-2" />
                      <p className="text-[11px] text-muted-foreground mt-1">Or scan this QR code &mdash; you'll also get an app picker at checkout.</p>
                    </div>
                  )}
                </div>
              </label>

              {/* Netbanking */}
              <label className={`flex items-start gap-4 cursor-pointer rounded-xl border p-4 transition-all ${paymentMethod === 'netbanking' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" name="payment" value="netbanking" checked={paymentMethod === 'netbanking'} onChange={() => setPaymentMethod('netbanking')} className="accent-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Netbanking</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Pay directly via your bank's netbanking login</p>
                  {paymentMethod === 'netbanking' && (
                    <div className="flex gap-2 mt-3">
                      {(['SBI', 'BOB'] as const).map((b) => (
                        <button
                          type="button"
                          key={b}
                          onClick={() => setNetbankingBank(b)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                            netbankingBank === b ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {b === 'SBI' ? 'State Bank of India' : 'Bank of Baroda'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Pay after Delivery */}
              <label className={`flex items-start gap-4 cursor-pointer rounded-xl border p-4 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Pay after Delivery</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Settle payment once your order arrives</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-sm">
            <div className="flex justify-between font-bold text-foreground text-base"><span>Amount to Pay</span><span>{formatRupee(total)}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Includes {gstRate}% GST of {formatRupee(gstAmount)}</p>
          </div>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Back</Button>
            <Button onClick={submitOrder} disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {paymentMethod === 'cod' ? 'Confirm & Place Order' : 'Proceed to Pay'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}