import { clinic } from "@skinsense/shared";

/** Razorpay redirects here after a payment-link payment. Public page. */
export default function Paid() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-sm space-y-3 p-8 text-center">
        <p className="eyebrow">Payment received</p>
        <h1 className="h-display text-4xl">Thank you</h1>
        <p className="text-sm text-muted">
          Your payment to {clinic.name} is being confirmed. You can close this page and return to the app.
        </p>
      </div>
    </main>
  );
}
