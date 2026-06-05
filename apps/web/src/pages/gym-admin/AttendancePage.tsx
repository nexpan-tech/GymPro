import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Users, DoorOpen, CalendarCheck, TrendingUp, QrCode, Plus, Download } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Select from "@/components/forms/Select";
import SearchInput from "@/components/common/SearchInput";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { attendanceService } from "@/services/attendance.service";
import { memberService } from "@/services/member.service";
import type { Attendance, AttendanceAnalytics, GymQr } from "@/types/attendance.types";
import type { Member } from "@/types/member.types";

type StatusFilter = "ALL" | "CHECKED_IN" | "CHECKED_OUT";

function time(d?: string | null) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";
}
function errMsg(err: unknown, fb: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fb;
}

export default function AttendancePage() {
  const toast = useToast();

  const [today, setToday] = useState<Attendance[]>([]);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState<GymQr | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualMemberId, setManualMemberId] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [t, a] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.getAnalytics(7),
      ]);
      setToday(t);
      setAnalytics(a);
    } catch (err) {
      console.error(err);
      setError("We couldn't load attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    memberService.list().then((r) => setMembers(r.data?.members ?? [])).catch(() => undefined);
  }, [load]);

  const inside = useMemo(() => today.filter((a) => a.status === "CHECKED_IN").length, [today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return today.filter((a) => {
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
      const name = a.member?.user?.name?.toLowerCase() ?? "";
      const email = a.member?.user?.email?.toLowerCase() ?? "";
      return matchesStatus && (!q || name.includes(q) || email.includes(q));
    });
  }, [today, search, statusFilter]);

  async function openQr() {
    setQrOpen(true);
    if (!qr) {
      try {
        setQr(await attendanceService.getQr());
      } catch (err) {
        toast.error(errMsg(err, "Failed to load QR."));
      }
    }
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr.dataUrl;
    a.download = `${qr.gymName.replace(/\s+/g, "-")}-attendance-qr.png`;
    a.click();
  }

  async function handleManualCheckIn() {
    if (!manualMemberId) return toast.error("Select a member.");
    try {
      setManualBusy(true);
      await attendanceService.manualCheckIn(manualMemberId);
      toast.success("Member checked in.");
      setManualOpen(false);
      setManualMemberId("");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to check in."));
    } finally {
      setManualBusy(false);
    }
  }

  async function handleCheckout(a: Attendance) {
    try {
      setBusyId(a.id);
      await attendanceService.checkOutMember(a.memberId);
      toast.success("Member checked out.");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to check out."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page
      title="Attendance"
      description="Live gym occupancy, today's check-ins, and the scan QR."
      action={
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={<QrCode className="h-4 w-4" />} onClick={() => void openQr()}>Gym QR</Button>
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setManualOpen(true)}>Manual Check-in</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Currently Inside" value={analytics?.currentOccupancy ?? inside} tone="success" icon={<DoorOpen className="h-5 w-5" />} />
          <StatCard label="Today's Check-ins" value={analytics?.todayCheckIns ?? today.length} icon={<CalendarCheck className="h-5 w-5" />} />
          <StatCard label="Avg / Day (7d)" value={analytics?.avgDailyAttendance ?? 0} icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="Total Check-ins" value={analytics?.totalCheckIns ?? 0} icon={<Users className="h-5 w-5" />} />
        </div>

        {/* Peak hours */}
        {analytics && analytics.peakHours.length > 0 && (
          <Card variant="solid" className="p-5">
            <p className="mb-3 text-sm font-semibold text-(--text-primary)">Peak hours (last {analytics.windowDays} days)</p>
            <div className="flex flex-wrap gap-2">
              {analytics.peakHours.map((h) => (
                <Badge key={h.hour} variant="info">
                  {String(h.hour).padStart(2, "0")}:00 — {h.count}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card variant="solid" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by member name or email" />
            </div>
            <div className="flex gap-2">
              {(["ALL", "CHECKED_IN", "CHECKED_OUT"] as StatusFilter[]).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "secondary"} onClick={() => setStatusFilter(s)}>
                  {s === "ALL" ? "All" : s === "CHECKED_IN" ? "Inside" : "Left"}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Today table */}
        {loading ? (
          <Card variant="solid" className="p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></Card>
        ) : error ? (
          <EmptyState title="Couldn't load attendance" message={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="No check-ins yet" message="Member check-ins for today will appear here." />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Check-in</th>
                    <th className="px-5 py-3 font-medium">Check-out</th>
                    <th className="px-5 py-3 font-medium">Source</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4">
                        <div className="font-medium text-(--text-primary)">{a.member?.user?.name ?? "—"}</div>
                        <div className="text-xs text-(--text-secondary)">{a.member?.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">{time(a.checkInAt)}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{time(a.checkOutAt)}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{a.source ?? "—"}</td>
                      <td className="px-5 py-4">
                        <Badge variant={a.status === "CHECKED_IN" ? "success" : "default"} dot>
                          {a.status === "CHECKED_IN" ? "Inside" : "Left"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {a.status === "CHECKED_IN" ? (
                          <Button size="sm" variant="secondary" loading={busyId === a.id} onClick={() => void handleCheckout(a)}>Check out</Button>
                        ) : (
                          <span className="text-xs text-(--text-secondary)">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* QR modal */}
      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Gym Attendance QR"
        description="Print and display this inside your gym. Members scan it to check in."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setQrOpen(false)}>Close</Button>
            <Button iconLeft={<Download className="h-4 w-4" />} onClick={downloadQr} disabled={!qr}>Download PNG</Button>
          </div>
        }
      >
        {qr ? (
          <div className="flex flex-col items-center gap-3">
            <img src={qr.dataUrl} alt="Gym attendance QR" className="h-56 w-56 rounded-xl border border-(--border) bg-white p-2" />
            <p className="text-sm font-medium text-(--text-primary)">{qr.gymName}</p>
            <p className="text-xs text-(--text-secondary)">Encodes: {qr.qrValue}</p>
          </div>
        ) : (
          <div className="flex justify-center py-10"><Skeleton height="h-40" width="w-40" /></div>
        )}
      </Modal>

      {/* Manual check-in modal */}
      <Modal
        open={manualOpen}
        onClose={() => !manualBusy && setManualOpen(false)}
        title="Manual Check-in"
        description="Check a member in without the QR (e.g. front desk)."
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setManualOpen(false)} disabled={manualBusy}>Cancel</Button>
            <Button onClick={() => void handleManualCheckIn()} loading={manualBusy}>Check in</Button>
          </div>
        }
      >
        <Select
          label="Member"
          options={members.map((m) => ({ label: `${m.user?.name ?? "Member"} (${m.user?.email ?? ""})`, value: m.id }))}
          value={manualMemberId}
          placeholder="Select a member"
          onChange={(e) => setManualMemberId(e.target.value)}
        />
      </Modal>
    </Page>
  );
}

function StatCard({ label, value, icon, tone = "default" }: { label: string; value: number; icon: ReactNode; tone?: "default" | "success"; }) {
  const toneClass = tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={toneClass}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
