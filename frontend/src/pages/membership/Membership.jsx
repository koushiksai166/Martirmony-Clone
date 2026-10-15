import { useEffect, useState } from "react";
import { Check, Crown, Receipt, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/ui/Badge";
import {
  createPaymentOrder,
  getMembership,
  getPaymentHistory,
  getPaymentPlans,
  verifyPayment,
  retryPayment,
  getInvoice,
  toggleAutoRenew,
} from "../../services/payment.service";

const PLAN_COLORS = {
  SILVER: "bg-slate-100 border-slate-300",
  GOLD: "bg-amber-50 border-amber-300",
  PLATINUM: "bg-purple-50 border-purple-300",
};

const PLAN_BADGE = {
  SILVER: "neutral",
  GOLD: "warning",
  PLATINUM: "info",
};

function Membership() {
  const [membership, setMembership] = useState(null);
  const [history, setHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("SILVER");
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [retryLoading, setRetryLoading] = useState(null);

  const load = async () => {
    try {
      const [membershipRes, historyRes, plansRes] = await Promise.all([
        getMembership(),
        getPaymentHistory(),
        getPaymentPlans(),
      ]);
      setMembership(membershipRes.data);
      setHistory(historyRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load membership");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const checkout = async (planKey) => {
    setPaying(true);
    try {
      const { data: order } = await createPaymentOrder(planKey);
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Vivah",
        description: `${order.planLabel} Membership`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(`${order.planLabel} membership activated!`);
            await load();
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        theme: { color: "#a9415c" },
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Unable to start payment");
    } finally {
      setPaying(false);
    }
  };

  const handleRetry = async (paymentId) => {
    setRetryLoading(paymentId);
    try {
      const { data: order } = await retryPayment(paymentId);
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Vivah",
        description: "Retry Payment",
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            await load();
          } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed");
          }
        },
        theme: { color: "#a9415c" },
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to retry payment");
    } finally {
      setRetryLoading(null);
    }
  };

  const handleInvoice = async (paymentId) => {
    setInvoiceLoading(paymentId);
    try {
      const { data } = await getInvoice(paymentId);
      // Open invoice in a new tab as formatted JSON (can be replaced with PDF later)
      const win = window.open("", "_blank");
      win.document.write(`<pre style="font-family:monospace;padding:24px">${JSON.stringify(data, null, 2)}</pre>`);
      win.document.title = `Invoice ${data.invoiceNumber}`;
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load invoice");
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleAutoRenew = async (enable) => {
    try {
      await toggleAutoRenew(enable);
      setMembership((prev) => ({ ...prev, autoRenew: enable }));
      toast.success(enable ? "Auto-renewal enabled" : "Auto-renewal disabled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update auto-renewal");
    }
  };

  const isActive = membership?.plan !== "FREE" && membership?.status === "ACTIVE";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="eyebrow">Membership</p>
          <h1 className="display-font mt-2 text-4xl">More room for meaningful connection.</h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
            Choose a plan that suits you. All plans are server-verified via Razorpay.
          </p>
        </div>

        {/* Current plan status */}
        <Card className="bg-[var(--ink)] p-7 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-white/60">Your current plan</p>
              <h2 className="display-font mt-2 text-3xl">
                {loading ? "Loading..." : membership?.plan ?? "Free"}
              </h2>
              {isActive && membership?.expiresAt && (
                <p className="mt-1 text-sm text-white/65">
                  Active until {new Date(membership.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Crown className="text-[#d9ad71]" size={30} />
          </div>

          {isActive && (
            <div className="mt-5 flex items-center gap-3">
              <Badge tone="success">Active</Badge>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={membership?.autoRenew ?? false}
                  onChange={(e) => handleAutoRenew(e.target.checked)}
                  className="rounded"
                />
                Auto-renew
              </label>
            </div>
          )}
        </Card>

        {/* Plan selector */}
        {!loading && (
          <div>
            <h2 className="display-font text-2xl mb-4">Choose a plan</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`rounded-xl border-2 p-5 text-left transition ${
                    PLAN_COLORS[plan.key]
                  } ${selectedPlan === plan.key ? "ring-2 ring-pink-500" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg">{plan.label}</p>
                    <Badge tone={PLAN_BADGE[plan.key]}>{plan.key}</Badge>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {plan.currency} {(plan.amount / 100).toFixed(0)}
                    <span className="text-sm font-normal text-slate-500">
                      /{plan.durationDays}d
                    </span>
                  </p>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check size={14} className="text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => checkout(selectedPlan)}
                disabled={paying}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {paying ? "Opening checkout..." : `Subscribe to ${selectedPlan}`}
              </Button>
              <ShieldCheck size={16} className="text-slate-400" />
              <span className="text-sm text-slate-500">Secured by Razorpay</span>
            </div>
          </div>
        )}

        {/* Payment history */}
        <Card className="p-7">
          <div className="flex items-center gap-3 mb-5">
            <Receipt className="text-[var(--rose)]" size={20} />
            <h2 className="display-font text-2xl">Payment history</h2>
          </div>

          {history.length ? (
            <div className="divide-y divide-[var(--line)]">
              {history.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                >
                  <div>
                    <p className="font-bold">
                      {payment.currency} {(payment.amount / 100).toFixed(2)}
                      {payment.refundedAmount > 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          (Refunded: {(payment.refundedAmount / 100).toFixed(2)})
                        </span>
                      )}
                    </p>
                    <p className="text-slate-500">{payment.plan} · {new Date(payment.createdAt).toLocaleString()}</p>
                    {payment.failureReason && (
                      <p className="text-xs text-red-500 mt-0.5">{payment.failureReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        payment.status === "CAPTURED"
                          ? "success"
                          : payment.status === "FAILED"
                          ? "danger"
                          : payment.status === "REFUNDED"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {payment.status}
                    </Badge>

                    {payment.status === "CAPTURED" && (
                      <button
                        onClick={() => handleInvoice(payment.id)}
                        disabled={invoiceLoading === payment.id}
                        className="text-xs text-pink-600 hover:underline disabled:opacity-50"
                      >
                        {invoiceLoading === payment.id ? "Loading..." : "Invoice"}
                      </button>
                    )}

                    {payment.status === "FAILED" && (
                      <button
                        onClick={() => handleRetry(payment.id)}
                        disabled={retryLoading === payment.id}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        {retryLoading === payment.id ? "Opening..." : "Retry"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No payment history yet.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Membership;
