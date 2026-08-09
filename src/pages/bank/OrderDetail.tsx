import React, { useRef, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { orders, payments } from '@/lib/api';
import { formatRupee } from '@/lib/utils';
import { load } from '@cashfreepayments/cashfree-js';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Printer,
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';

function PaymentStatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  > = {
    Paid: {
      label: 'Payment Successful',
      className:
        'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },

    Failed: {
      label: 'Payment Failed',
      className: 'bg-red-500/10 text-red-500 ring-red-500/20',
      icon: <XCircle className="h-3.5 w-3.5" />,
    },

    Pending: {
      label: 'Payment Pending',
      className:
        'bg-amber-500/10 text-amber-500 ring-amber-500/20',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };

  const cfg = map[status] ?? map.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function OrderDetail() {
  const [, params] = useRoute('/orders/:id');
  const [, setLocation] = useLocation();

  const id = Number(params?.id);
  const printRef = useRef<HTMLDivElement>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  /*
   * Read the query parameter after returning from Cashfree.
   *
   * payment=success
   * payment=failed
   * payment=cod
   */
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;

  const paymentParam = searchParams?.get('payment');

  /*
   * Fetch order.
   *
   * When returning from Cashfree, poll for a few seconds because
   * Cashfree webhook may arrive slightly after the browser redirect.
   */
  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orders.get(id),
    enabled: !!id,

    refetchInterval:
      paymentParam === 'success' || paymentParam === 'failed'
        ? 2000
        : false,
  });

  const handlePrint = () => {
    window.print();
  };

  /**
   * Opens Cashfree Checkout.
   */
  /**
 * Opens Cashfree Checkout.
 */
const handlePayment = async () => {
  if (!order) return;

  try {
    setIsPaying(true);
    setPaymentError('');

    console.log('Starting Cashfree payment for order:', order.id);

    // Create Cashfree payment session on backend
    const paymentSession = await payments.createPaymentSession(order.id);

    console.log('Cashfree payment session:', paymentSession);

    if (!paymentSession?.paymentSessionId) {
      throw new Error(
        'Cashfree did not return a payment session.'
      );
    }

    // Remember order being paid
    localStorage.setItem(
      'cashfree_pending_order_id',
      String(order.id)
    );

    // Load Cashfree SDK
    const cashfree = await load({
      mode:
        paymentSession.environment === 'PRODUCTION'
          ? 'production'
          : 'sandbox',
    });

    if (!cashfree) {
      throw new Error(
        'Unable to load Cashfree payment gateway.'
      );
    }

    console.log('Opening Cashfree checkout...');

    // Open Cashfree Checkout
    await cashfree.checkout({
      paymentSessionId: paymentSession.paymentSessionId,
      redirectTarget: '_self',
    });

  } catch (error: any) {
    console.error('Cashfree payment error:', error);

    setPaymentError(
      error?.message ||
        'Unable to start payment. Please try again.'
    );

    setIsPaying(false);
  }
};

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground/30" />

        <p className="text-muted-foreground">
          Order not found.
        </p>

        <Link href="/dashboard">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  /*
   * Determine whether payment needs attention.
   */
  const paymentNeedsAction =
    order.paymentStatus === 'Pending' ||
    order.paymentStatus === 'Failed';

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full">

      {/* ========================================================= */}
      {/* PAYMENT SUCCESS BANNER */}
      {/* ========================================================= */}

      {paymentParam === 'success' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 print:hidden">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />

          <div>
            <p className="font-semibold text-emerald-500">
              Payment Successful
            </p>

            <p className="text-sm text-muted-foreground">
              {order.paymentStatus === 'Paid'
                ? 'Your payment has been confirmed successfully.'
                : 'Payment completed. We are confirming it with the payment gateway...'}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYMENT FAILED BANNER */}
      {/* ========================================================= */}

      {paymentParam === 'failed' && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 print:hidden">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />

            <div>
              <p className="font-semibold text-red-500">
                Payment Failed
              </p>

              <p className="text-sm text-muted-foreground">
                Your order was saved, but the payment was not
                completed. Please try again.
              </p>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isPaying}
            className="gap-2"
          >
            {isPaying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* COD BANNER */}
      {/* ========================================================= */}

      {paymentParam === 'cod' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 print:hidden">
          <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />

          <div>
            <p className="font-semibold text-primary">
              Order Placed Successfully
            </p>

            <p className="text-sm text-muted-foreground">
              Payment will be collected after delivery.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYMENT ERROR */}
      {/* ========================================================= */}

      {paymentError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 print:hidden">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />

            <div>
              <p className="font-semibold text-red-500">
                Unable to start payment
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                {paymentError}
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPaymentError('');
                  handlePayment();
                }}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIONS */}
      {/* ========================================================= */}

      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">

        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-3 flex-wrap justify-end">

          <PaymentStatusPill
            status={order.paymentStatus}
          />

          <StatusBadge status={order.status} />

          {/* PAY NOW / TRY AGAIN */}

          {paymentNeedsAction && (
            <Button
              onClick={handlePayment}
              disabled={isPaying}
              size="sm"
              className="gap-2"
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />

                  {order.paymentStatus === 'Failed'
                    ? 'Try Again'
                    : 'Pay Now'}
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAYMENT SUCCESS STATE */}
      {/* ========================================================= */}

      {order.paymentStatus === 'Paid' && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 print:hidden">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />

            <div>
              <p className="font-semibold text-emerald-500">
                Payment Successful
              </p>

              <p className="text-sm text-muted-foreground">
                Your payment for this order has been successfully
                received.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYMENT FAILED STATE */}
      {/* ========================================================= */}

      {order.paymentStatus === 'Failed' && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 print:hidden">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />

              <div>
                <p className="font-semibold text-red-500">
                  Payment Failed
                </p>

                <p className="text-sm text-muted-foreground">
                  The payment was unsuccessful. You can try again.
                </p>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isPaying}
              className="gap-2"
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INVOICE */}
      {/* ========================================================= */}

      <div
        ref={printRef}
        className="bg-card border border-border rounded-xl p-8 shadow-sm print:shadow-none print:border-0"
      >

        {/* Header */}

        <div className="flex justify-between items-start pb-6 border-b border-border">

          <div>
            <h1 className="text-2xl font-bold text-primary">
              Bhavya Printers
            </h1>

            <p className="text-sm text-muted-foreground">
              Est. 1996 · Bharuch, Gujarat
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Premium Stationery for Banking Institutions
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">
              TAX INVOICE
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Order #{order.id}
            </p>

            <p className="text-sm text-muted-foreground">
              {order.createdAt
                ? format(
                    new Date(order.createdAt),
                    'dd MMM yyyy'
                  )
                : '—'}
            </p>
          </div>

        </div>

        {/* Bill To */}

        <div className="grid grid-cols-2 gap-8 py-6 border-b border-border">

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Bill To
            </p>

            <p className="font-bold text-foreground">
              {order.bankName}
            </p>

            <p className="text-sm text-muted-foreground">
              {order.branchName}
            </p>

            <p className="text-sm text-muted-foreground">
              {order.address}
            </p>

            <p className="text-sm text-muted-foreground">
              {order.email}
            </p>

            <p className="text-sm text-muted-foreground">
              {order.mobile}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              GST Details
            </p>

            <div className="space-y-1 text-sm">

              <div>
                <span className="text-muted-foreground">
                  GST No:{' '}
                </span>

                <span className="font-mono font-medium text-foreground">
                  {order.gstNo}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">
                  PAN No:{' '}
                </span>

                <span className="font-mono font-medium text-foreground">
                  {order.panNo}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">
                  Payment:{' '}
                </span>

                <span className="capitalize text-foreground">
                  {order.paymentMethod}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">
                  Payment Status:{' '}
                </span>

                <span className="text-foreground">
                  {order.paymentStatus}
                </span>
              </div>

              {order.upiId && (
                <div>
                  <span className="text-muted-foreground">
                    UPI:{' '}
                  </span>

                  <span className="text-foreground">
                    {order.upiId}
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Items Table */}

        <div className="py-6 border-b border-border">

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider border-b border-border">

                <th className="pb-3 pr-4">
                  #
                </th>

                <th className="pb-3 pr-4">
                  Product
                </th>

                <th className="pb-3 pr-4 text-right">
                  Unit Price
                </th>

                <th className="pb-3 pr-4 text-right">
                  Qty
                </th>

                <th className="pb-3 text-right">
                  Amount
                </th>

              </tr>
            </thead>

            <tbody>

              {order.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0"
                >

                  <td className="py-3 pr-4 text-muted-foreground">
                    {i + 1}
                  </td>

                  <td className="py-3 pr-4 font-medium text-foreground">
                    {item.productName}
                  </td>

                  <td className="py-3 pr-4 text-right font-mono">
                    {formatRupee(item.unitPrice)}
                  </td>

                  <td className="py-3 pr-4 text-right">
                    {item.quantity}
                  </td>

                  <td className="py-3 text-right font-mono font-semibold">
                    {formatRupee(item.totalPrice)}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* Totals */}

        <div className="pt-6">

          <div className="ml-auto max-w-xs space-y-2 text-sm">

            <div className="flex justify-between text-muted-foreground">
              <span>
                Subtotal (Taxable Amount)
              </span>

              <span className="font-mono">
                {formatRupee(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>
                CGST ({order.gstRate / 2}%)
              </span>

              <span className="font-mono">
                {formatRupee(order.gstAmount / 2)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>
                SGST ({order.gstRate / 2}%)
              </span>

              <span className="font-mono">
                {formatRupee(order.gstAmount / 2)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>
                Total GST ({order.gstRate}%)
              </span>

              <span className="font-mono">
                {formatRupee(order.gstAmount)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">

              <span>
                Total Amount
              </span>

              <span className="font-mono text-primary">
                {formatRupee(order.total)}
              </span>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground text-center">

          <p>
            This is a computer-generated invoice. No signature required.
          </p>

          <p className="mt-1">
            Bhavya Printers · Bharuch, Gujarat · Est. 1996
          </p>

        </div>

      </div>
    </div>
  );
}