import { useEffect, useState } from "react";
import { Check, Crown, Receipt, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/ui/Badge";
import {
  createPaymentOrder,
  getMembership,
  getPaymentHistory,
  getPaymentPlan,
  verifyPayment,
} from "../../services/payment.service";

/**
 * Membership Page Component
 *
 * Manages premium membership subscriptions & payment checkout:
 * - Fetches active membership status, available pricing plans, and past billing history.
 * - Integrates Razorpay Checkout modal for seamless payment processing.
 * - Sends payment signatures (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`)
 *   to the backend `/payments/verify` endpoint for secure cryptographic verification.
 * - Displays detailed transaction audit history.
 */
function Membership() {
  const [membership, setMembership] = useState(null);
  const [history, setHistory] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  /**
   * Fetches membership status, payment history, and pricing plan in parallel
   */
  const load = async () => {
    try {
      const [membershipResponse, historyResponse, planResponse] =
        await Promise.all([
          getMembership(),
          getPaymentHistory(),
          getPaymentPlan(),
        ]);
      setMembership(membershipResponse.data);
      setHistory(historyResponse.data);
      setPlan(planResponse.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load membership"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    load();
  }, []);

  /**
   * Initiates Razorpay payment order and launches the checkout modal
   */
  const checkout = async () => {
    setPaying(true);
    try {
      // 1. Create payment order on the server
      const { data: order } = await createPaymentOrder();

      // Ensure Razorpay SDK script is available in browser window
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable");
      }

      // 2. Configure and launch Razorpay checkout modal
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Saanjh",
        description: "Premium membership",
        order_id: order.orderId,
        handler: async (response) => {
          // 3. Verify signature with server upon successful transaction
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Premium membership activated");
            await load();
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed"
            );
          }
        },
        theme: { color: "#a9415c" },
      });

      razorpay.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment"
      );
    } finally {
      setPaying(false);
    }
  };

  // Helper boolean checking if current user holds active premium tier
  const active =
    membership?.plan === "PREMIUM" && membership.status === "ACTIVE";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Title */}
        <div>
          <p className="eyebrow">Membership</p>
          <h1 className="display-font mt-2 text-4xl">
            More room for meaningful connection.
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
            Premium access is verified by the server after Razorpay confirms
            your payment.
          </p>
        </div>

        {/* Current Plan & Feature Benefits Grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Current Plan Card */}
          <Card className="bg-[var(--ink)] p-7 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Your current plan</p>
                <h2 className="display-font mt-2 text-3xl">
                  {loading ? "Loading..." : active ? "Premium" : "Free"}
                </h2>
              </div>
              <Crown className="text-[#d9ad71]" size={30} />
            </div>

            <p className="mt-6 text-sm leading-6 text-white/65">
              {active
                ? `Active until ${
                    membership.expiresAt
                      ? new Date(membership.expiresAt).toLocaleDateString()
                      : "renewal"
                  }.`
                : "Upgrade to unlock premium membership benefits."}
            </p>

            {active ? (
              <div className="mt-6">
                <Badge tone="success">Active membership</Badge>
              </div>
            ) : (
              <Button
                onClick={checkout}
                disabled={paying || !plan}
                className="mt-6 bg-[#d9ad71] text-[var(--ink)] hover:bg-[#efc98d]"
              >
                {paying
                  ? "Opening checkout..."
                  : plan
                  ? `Upgrade for ${plan.currency} ${(plan.amount / 100).toFixed(
                      2
                    )}`
                  : "Loading plan..."}
              </Button>
            )}
          </Card>

          {/* Premium Inclusions Card */}
          <Card className="p-7">
            <h2 className="display-font text-2xl">Premium includes</h2>
            <ul className="mt-5 space-y-4 text-sm text-[var(--ink-soft)]">
              <li className="flex gap-3">
                <Check className="text-[var(--success)]" size={18} />
                Advanced discovery and preferences
              </li>
              <li className="flex gap-3">
                <Check className="text-[var(--success)]" size={18} />
                More intentional introductions
              </li>
              <li className="flex gap-3">
                <Check className="text-[var(--success)]" size={18} />
                A richer way to stay connected
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="text-[var(--success)]" size={18} />
                Secure, server-verified billing
              </li>
            </ul>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="p-7">
          <div className="flex items-center gap-3">
            <Receipt className="text-[var(--rose)]" size={20} />
            <h2 className="display-font text-2xl">Payment history</h2>
          </div>

          {history.length ? (
            <div className="mt-5 divide-y divide-[var(--line)]">
              {history.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                >
                  <div>
                    <p className="font-bold">
                      {payment.currency} {(payment.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-[var(--muted)]">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    tone={
                      payment.status === "CAPTURED"
                        ? "success"
                        : payment.status === "FAILED"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">
              No payment history yet.
            </p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Membership;

