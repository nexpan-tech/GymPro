import { useCallback, useEffect, useState } from "react";
import { Calendar, CreditCard, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { membershipService, type MembershipRecord } from "@/services/membership.service";

function daysLeft(endDate?: string) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function MembershipDetailsPage() {
  const [membership, setMembership] = useState<MembershipRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembership = useCallback(async () => {
    try {
      const data = await membershipService.getMyActive();
      setMembership(data);
    } catch (error) {
      console.error("Failed to load membership", error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembership();
  }, [loadMembership]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading membership...</div>;
  }

  if (!membership) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Membership Details"
          description="Your membership information will appear here."
        />
        <Card variant="glass" padding="lg">
          <p className="text-(--text-secondary)">No active membership found.</p>
        </Card>
      </div>
    );
  }

  const renewalDays = daysLeft((membership as any).endDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Details"
        description="Track your current plan, renewal date, and payment status."
      />

      <Card variant="premium">
        <CardContent className="grid gap-6 md:grid-cols-3">
          <InfoCard
            icon={ShieldCheck}
            label="Plan"
            value={(membership as any).plan || "Active Plan"}
          />
          <InfoCard
            icon={CreditCard}
            label="Payment"
            value={(membership as any).paymentStatus || "ACTIVE"}
          />
          <InfoCard
            icon={Calendar}
            label="Renewal"
            value={
              renewalDays !== null ? `${renewalDays} days left` : "Not available"
            }
          />
        </CardContent>
      </Card>

      <Card variant="glass" padding="lg">
        <div className="grid gap-5 md:grid-cols-2">
          <Detail label="Start Date" value={(membership as any).startDate} date />
          <Detail label="End Date" value={(membership as any).endDate} date />
          <Detail label="Amount" value={`₹${(membership as any).amount ?? 0}`} />
          <Detail label="Status" value={(membership as any).paymentStatus || "ACTIVE"} />
        </div>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-(--surface-secondary) p-5">
      <Icon className="h-6 w-6 text-indigo-500" />
      <p className="mt-4 text-sm font-semibold text-(--text-secondary)">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-(--text-primary)">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  date = false,
}: {
  label: string;
  value?: string;
  date?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-(--text-secondary)">{label}</p>
      <p className="mt-1 text-base font-bold text-(--text-primary)">
        {value
          ? date
            ? new Date(value).toLocaleDateString()
            : value
          : "N/A"}
      </p>
    </div>
  );
}