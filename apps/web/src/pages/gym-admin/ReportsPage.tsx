import { useState, type ReactNode } from "react";
import {
  FileText, Download, Loader2, IndianRupee, Users, CalendarCheck, HeartPulse,
} from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import {
  MetricCard, SectionHeader, EmptyMomentumState,
} from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";

interface MonthlyReport {
  gymName: string;
  month: string;
  membership: { activeMembers: number; newMembers: number; expired: number; renewals: number };
  revenue: { revenue: number; payments: number; outstandingDues: number };
  attendance: { total: number };
  trainerActivity: { messages: number };
  training: { workoutCompletions: number; dietCompletions: number };
  retention: { avgRetentionScore: number; atRiskMembers: number };
  leads: { totalLeads: number; converted: number; conversionRate: number };
  engagement: { challengeParticipations: number; rewardRedemptions: number; referrals: number; referralConversions: number };
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await api.get(`/reports/monthly`, { params: { month } });
      setReport((res.data?.data ?? res.data) as MonthlyReport);
    } catch {
      setError("Couldn't generate the report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/monthly`, { params: { month, format: "pdf" }, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym-report-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch {
      toast.error("PDF download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Page title="Reports" eyebrow="Business Intelligence Studio" description="Turn a month of gym activity into a boardroom-ready report — then export it as a polished PDF.">
      <div className="space-y-8">
        {/* ── Builder controls ──────────────────────────────────────────────── */}
        <div className="surface-card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="eyebrow mb-1.5 block">Reporting month</label>
              <input
                type="month"
                className="block h-10 rounded-xl border border-border bg-(--surface-solid) px-3 text-sm text-(--text-primary) outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                max={currentMonth()}
              />
            </div>
            <Button iconLeft={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} loading={loading} onClick={generate}>
              Generate Report
            </Button>
            {report && (
              <Button variant="secondary" iconLeft={<Download className="h-4 w-4" />} loading={downloading} onClick={downloadPdf}>
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<FileText />}
              title="Report didn't generate"
              description={error}
              action={<Button variant="secondary" onClick={generate}>Try again</Button>}
            />
          </div>
        ) : !report ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<FileText />}
              title="Your business story, on demand"
              description="Pick a month and generate a complete performance report — revenue, retention, attendance, and growth in one place."
              action={<Button iconLeft={<FileText className="h-4 w-4" />} onClick={generate}>Generate this month</Button>}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Snapshot */}
            <div>
              <SectionHeader
                eyebrow={report.month}
                title={`${report.gymName} · Monthly snapshot`}
              />
              <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Revenue (paid)" value={inr(report.revenue.revenue)} icon={<IndianRupee />} tone="energy" />
                <MetricCard label="Active Members" value={report.membership.activeMembers} icon={<Users />} tone="neutral" />
                <MetricCard label="Check-ins" value={report.attendance.total} icon={<CalendarCheck />} tone="neutral" />
                <MetricCard label="Retention Score" value={report.retention.avgRetentionScore} icon={<HeartPulse />} tone="energy" />
              </div>
            </div>

            {/* Detail */}
            <div>
              <SectionHeader eyebrow="Breakdown" title="The full picture" />
              <div className="grid gap-5 lg:grid-cols-2">
                <ReportCard title="Membership" rows={[["Active members", report.membership.activeMembers], ["New members", report.membership.newMembers], ["Expired", report.membership.expired], ["Renewals", report.membership.renewals]]} />
                <ReportCard title="Revenue" rows={[["Revenue (paid)", inr(report.revenue.revenue)], ["Payments", report.revenue.payments], ["Outstanding dues", inr(report.revenue.outstandingDues)]]} />
                <ReportCard title="Attendance & Training" rows={[["Check-ins", report.attendance.total], ["Workout completions", report.training.workoutCompletions], ["Diet completions", report.training.dietCompletions], ["Trainer messages", report.trainerActivity.messages]]} />
                <ReportCard title="Retention" rows={[["Avg retention score", report.retention.avgRetentionScore], ["At-risk members", report.retention.atRiskMembers]]} />
                <ReportCard title="Lead Conversion" rows={[["Total leads", report.leads.totalLeads], ["Converted", report.leads.converted], ["Conversion rate", `${report.leads.conversionRate}%`]]} />
                <ReportCard title="Engagement" rows={[["Challenge participations", report.engagement.challengeParticipations], ["Reward redemptions", report.engagement.rewardRedemptions], ["Referrals (converted)", `${report.engagement.referrals} (${report.engagement.referralConversions})`]]} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

function ReportCard({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <div className="surface-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-(--text-primary)">
        <span className="section-tick" aria-hidden="true" />
        {title}
      </h3>
      <div className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-border/60 pb-2.5 text-sm last:border-0 last:pb-0">
            <span className="text-(--text-secondary)">{label}</span>
            <span className="font-black tabular-nums text-(--text-primary)">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
