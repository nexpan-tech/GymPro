import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, DoorOpen, CalendarCheck, TrendingUp, QrCode, Plus, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/forms/Select";
import SearchInput from "@/components/common/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CommandHero,
  Highlight,
  MetricCard,
  SectionHeader,
  StatusPill,
  EmptyMomentumState,
} from "@/components/premium";
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
  const occupancy = analytics?.currentOccupancy ?? inside;
  const todayCount = analytics?.todayCheckIns ?? today.length;

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
    <div className="space-y-8">
      {/* ── Live Gym Floor hero ─────────────────────────────────────────────── */}
      <CommandHero
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span className="pulse-dot" aria-hidden="true" />
            Live Gym Floor
          </span>
        }
        title={
          loading ? (
            <>Reading the floor…</>
          ) : occupancy > 0 ? (
            <>
              {occupancy} {occupancy === 1 ? "member is" : "members are"}{" "}
              <Highlight>training right now.</Highlight>
            </>
          ) : (
            <>
              The floor is <Highlight>ready.</Highlight>
            </>
          )
        }
        subtitle="Real-time occupancy, today's check-ins, and front-desk controls — your gym, live."
        stats={[
          { label: "Inside now", value: loading ? "—" : occupancy.toLocaleString("en-IN") },
          { label: "Today's check-ins", value: loading ? "—" : todayCount.toLocaleString("en-IN") },
        ]}
        actions={
          <>
            <button
              onClick={() => void openQr()}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
            >
              <QrCode className="h-3.5 w-3.5" />
              Gym QR
            </button>
            <button
              onClick={() => setManualOpen(true)}
              className="press inline-flex items-center gap-1.5 rounded-xl bg-(image:--gradient-primary) px-4 py-2 text-xs font-bold text-white shadow-[0_8px_22px_rgba(231,55,37,0.4)] transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Manual Check-in
            </button>
          </>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 stagger lg:grid-cols-4">
        <MetricCard label="Currently Inside" value={occupancy} icon={<DoorOpen />} tone="energy" loading={loading} />
        <MetricCard label="Today's Check-ins" value={todayCount} icon={<CalendarCheck />} tone="neutral" loading={loading} />
        <MetricCard label="Avg / Day (7d)" value={analytics?.avgDailyAttendance ?? 0} icon={<TrendingUp />} tone="neutral" loading={loading} />
        <MetricCard label="Total Check-ins" value={analytics?.totalCheckIns ?? 0} icon={<Users />} tone="neutral" loading={loading} />
      </div>

      {/* ── Peak hours ──────────────────────────────────────────────────────── */}
      {analytics && analytics.peakHours.length > 0 && (
        <div className="surface-card p-5">
          <p className="eyebrow mb-3 flex items-center gap-2">
            <span className="section-tick" aria-hidden="true" />
            Peak hours · last {analytics.windowDays} days
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.peakHours.map((h) => (
              <span key={h.hour} className="chip">
                {String(h.hour).padStart(2, "0")}:00
                <span className="text-primary">· {h.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's roster ──────────────────────────────────────────────────── */}
      <div>
        <SectionHeader eyebrow="Today" title="Who's on the floor" />

        {/* Filters */}
        <div className="surface-card mb-4 p-4">
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
        </div>

        {loading ? (
          <div className="surface-card p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></div>
        ) : error ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<CalendarCheck />}
              title="Couldn't load the floor"
              description={error}
              action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<DoorOpen />}
              title="The doors are open"
              description="Today's check-ins will appear here the moment members scan in. Display your gym QR to get the floor moving."
              action={<Button iconLeft={<QrCode className="h-4 w-4" />} variant="secondary" onClick={() => void openQr()}>Show gym QR</Button>}
            />
          </div>
        ) : (
          <div className="surface-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                  <tr>
                    <th className="px-5 py-3 font-bold">Member</th>
                    <th className="px-5 py-3 font-bold">Check-in</th>
                    <th className="px-5 py-3 font-bold">Check-out</th>
                    <th className="px-5 py-3 font-bold">Source</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-(--surface-hover)">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                            {(a.member?.user?.name ?? "—").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-(--text-primary)">{a.member?.user?.name ?? "—"}</div>
                            <div className="truncate text-xs text-(--text-muted)">{a.member?.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{time(a.checkInAt)}</td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{time(a.checkOutAt)}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{a.source ?? "—"}</td>
                      <td className="px-5 py-4">
                        <StatusPill tone={a.status === "CHECKED_IN" ? "live" : "neutral"} size="sm">
                          {a.status === "CHECKED_IN" ? "Inside" : "Left"}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {a.status === "CHECKED_IN" ? (
                          <Button size="sm" variant="secondary" loading={busyId === a.id} onClick={() => void handleCheckout(a)}>Check out</Button>
                        ) : (
                          <span className="text-xs text-(--text-muted)">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
            <img src={qr.dataUrl} alt="Gym attendance QR" className="h-56 w-56 rounded-xl border border-border bg-white p-2" />
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
    </div>
  );
}
