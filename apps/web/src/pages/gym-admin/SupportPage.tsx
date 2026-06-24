import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Clock, Building2, BookOpen, MessageSquare, LifeBuoy, Crown } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader, StatusPill, type StatusTone } from "@/components/premium";
import { SUPPORT } from "@/config/support";
import { licenseService, type GymLicenseDetail } from "@/services/license.service";
import { planPriceLabel } from "@/lib/pricing";

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function statusTone(s?: string): StatusTone {
  switch (s) {
    case "ACTIVE": return "completed";
    case "TRIALING": return "active";
    case "PAST_DUE": return "pending";
    case "SUSPENDED": case "EXPIRED": case "CANCELLED": return "expired";
    default: return "neutral";
  }
}

export default function SupportPage() {
  const navigate = useNavigate();
  const [license, setLicense] = useState<GymLicenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // License/subscription status is fetched LIVE (gym-admin self view).
    licenseService.myLicense()
      .then((l) => { if (active) setLicense(l); })
      .catch(() => { if (active) setLicense(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const lic = license?.license ?? null;

  return (
    <Page title="Support" eyebrow="Help" description={`Get help from the ${SUPPORT.companyName} team — your subscription, account and platform support in one place.`}>
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact */}
          <Card variant="solid" className="p-6">
            <SectionHeader eyebrow={SUPPORT.companyName} title={<span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" /> Contact Support</span>} />
            <dl className="mt-2 space-y-3 text-sm">
              <Row icon={<Building2 className="h-4 w-4 text-primary" />} label="Company" value={SUPPORT.companyName} />
              <Row icon={<Mail className="h-4 w-4 text-primary" />} label="Support email" value={SUPPORT.email} />
              <Row icon={<Phone className="h-4 w-4 text-primary" />} label="Support phone" value={SUPPORT.phone} />
              <Row icon={<Clock className="h-4 w-4 text-primary" />} label="Business hours" value={SUPPORT.hours} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" iconLeft={<Mail className="h-4 w-4" />} onClick={() => { window.location.href = `mailto:${SUPPORT.email}?subject=GymPro Support Request`; }}>Send Email</Button>
              <Button size="sm" variant="secondary" iconLeft={<Phone className="h-4 w-4" />} onClick={() => { window.location.href = `tel:${SUPPORT.phone.replace(/\s/g, "")}`; }}>Call Support</Button>
              {/* Reuse the existing in-app chat rather than building a new one. */}
              <Button size="sm" variant="secondary" iconLeft={<MessageSquare className="h-4 w-4" />} onClick={() => navigate("/gym-admin/chat")}>Open Chat</Button>
              <Button size="sm" variant="ghost" iconLeft={<BookOpen className="h-4 w-4" />} onClick={() => window.open(SUPPORT.docsUrl, "_blank", "noopener")}>Help Docs</Button>
            </div>
          </Card>

          {/* Subscription + license status (live) */}
          <Card variant="solid" className="p-6">
            <SectionHeader eyebrow="Your account" title={<span className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Subscription &amp; License</span>} />
            {loading ? (
              <div className="mt-3 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="h-6" />)}</div>
            ) : lic ? (
              <dl className="mt-2 space-y-3 text-sm">
                <Row label="Current plan" value={lic.name} />
                <Row label="Price" value={planPriceLabel(lic.monthlyPrice, lic.interval)} />
                <Row label="Status" value={<StatusPill tone={statusTone(lic.status)} size="sm">{lic.isTrial ? "TRIAL" : lic.status}</StatusPill>} />
                <Row label="Renews / expires" value={fmtDate(lic.renewalDate)} />
                {lic.isTrial && <Row label="Trial ends" value={fmtDate(lic.trialEndsAt)} />}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-(--text-secondary)">No active license found for this gym. Please contact support to set up your subscription.</p>
            )}
            <p className="mt-4 text-xs text-(--text-muted)">Support tickets: email or call us using the options on the left — we respond within one business day. Your subscription details above are read live from your account.</p>
          </Card>
        </div>
      </div>
    </Page>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-(--text-secondary)">{icon}{label}</dt>
      <dd className="font-medium text-(--text-primary)">{value}</dd>
    </div>
  );
}
