import { payments, Bank } from '@/lib/api';

export function loadRazorpayScript(): Promise<boolean> {
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

type PayForOrderResult = 'success' | 'failed';

/**
 * Opens Razorpay Checkout for an order that already exists in our system
 * (i.e. payment is being retried/collected after order creation, as opposed
 * to the initial checkout flow in PlaceOrder.tsx which creates the order
 * and pays in one step). Resolves with 'success' once /payments/verify has
 * confirmed the signature, or 'failed' if the user cancels or it fails.
 */
export async function payForExistingOrder(
  orderId: number,
  bank: Bank
): Promise<PayForOrderResult> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Could not load payment gateway. Check your internet connection.');
  }

  const paymentOrder = await payments.createPaymentOrder(orderId);

  return new Promise((resolve) => {
    const options: any = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: 'Bhavya Printers',
      description: `Order #${orderId}`,
      order_id: paymentOrder.razorpayOrderId,
      prefill: {
        name: bank.bankName,
        email: bank.email,
        contact: bank.mobile,
      },
      handler: async (response: any) => {
        try {
          await payments.verifyPayment({
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve('success');
        } catch {
          resolve('failed');
        }
      },
      modal: {
        ondismiss: () => resolve('failed'),
      },
      theme: { color: '#f59e0b' },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', () => resolve('failed'));
    rzp.open();
  });
}