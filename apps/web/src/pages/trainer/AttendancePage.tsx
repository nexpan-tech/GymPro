import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, DoorOpen, Users, RefreshCw } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import Select from "@/components/forms/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile, SectionHeader, StatusPill, EmptyMomentumState } from "@/components/premium";
import { memberService } from "@/services/member.service";
import { attendanceService } from "@/services/attendance.service";
import type { Attendance } from "@/types/attendance.types";

interface AssignedMember {
  id: string;
  name: string;
  email?: string;
}

interface AttendanceRow extends Attendance {
  memberName: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(iso: string | null | undefined, ymd: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return local === ymd;
}

function timeOf(iso?: string | null) {
  return iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";
}

/**
 * Trainer attendance — strictly scoped to the trainer's assigned members.
 * The member list is server-scoped (TRAINER → assigned only) and each
 * `/attendance/member/:id` call re-enforces the trainer→assigned check, so a
 * trainer can never see an unassigned member's attendance.
 */
export default function TrainerAttendancePage() {
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(todayStr());
  const [memberFilter, setMemberFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const memRes = await memberService.list();
      const assigned: AssignedMember[] = (memRes.data.members ?? []).map((m) => ({
        id: m.id,
        name: m.user?.name ?? "Member",
        email: m.user?.email,
      }));
      setMembers(assigned);

      // Pull each assigned member's history; backend re-checks assignment.
      const perMember = await Promise.all(
        assigned.map(async (m) => {
          const recs = await attendanceService.getByMember(m.id).catch(() => [] as Attendance[]);
          return recs.map((r) => ({ ...r, memberName: m.name }));
        }),
      );
      setRecords(perMember.flat());
    } catch (err) {
      console.error(err);
      setError("We couldn't load attendance for your members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return records
      .filter((r) => sameDay(r.checkInAt ?? r.date, date))
      .filter((r) => memberFilter === "ALL" || r.memberId === memberFilter)
      .sort((a, b) => new Date(b.checkInAt ?? b.date).getTime() - new Date(a.checkInAt ?? a.date).getTime());
  }, [records, date, memberFilter]);

  const stats = useMemo(() => {
    const onDate = records.filter((r) => sameDay(r.checkInAt ?? r.date, date));
    const inside = onDate.filter((r) => r.status === "CHECKED_IN" && !r.checkOutAt).length;
    return { assigned: members.length, checkIns: onDate.length, inside };
  }, [records, date, members.length]);

  const memberOptions = [
    { value: "ALL", label: "All assigned members" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <Page
      title="Attendance"
      eyebrow="Member Check-ins"
      description="Track today's attendance and history for your assigned members."
      action={
        <Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          <StatTile label="Assigned Members" value={loading ? "—" : stats.assigned} icon={<Users />} tone="energy" />
          <StatTile label="Check-ins (selected day)" value={loading ? "—" : stats.checkIns} icon={<CalendarCheck />} tone="neutral" />
          <StatTile label="Currently Inside" value={loading ? "—" : stats.inside} icon={<DoorOpen />} tone="energy" />
        </div>

        {/* Filters */}
        <div className="surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <label className="eyebrow mb-1.5 block">Date</label>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-(--surface-solid) px-3 text-sm text-(--text-primary) outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex-1">
              <Select
                label="Member"
                options={memberOptions}
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Roster */}
        <div>
          <SectionHeader
            eyebrow={date === todayStr() ? "Today" : date}
            title="Attendance"
            action={<span className="text-xs font-semibold text-(--text-muted)">{filtered.length} record{filtered.length === 1 ? "" : "s"}</span>}
          />

          {loading ? (
            <div className="surface-card p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></div>
          ) : error ? (
            <div className="surface-card">
              <EmptyMomentumState icon={<CalendarCheck />} title="Couldn't load attendance" description={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} />
            </div>
          ) : members.length === 0 ? (
            <div className="surface-card">
              <EmptyMomentumState
                icon={<Users />}
                title="No members assigned yet"
                description="Once your gym admin assigns members to you, their attendance will show up here."
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-card">
              <EmptyMomentumState
                icon={<DoorOpen />}
                title="No check-ins for this day"
                description="None of your members checked in on the selected date. Try another day, or rally them to show up!"
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((r) => {
                      const inside = r.status === "CHECKED_IN" && !r.checkOutAt;
                      return (
                        <tr key={r.id} className="transition-colors hover:bg-(--surface-hover)">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                                {r.memberName.charAt(0).toUpperCase()}
                              </span>
                              <span className="font-bold text-(--text-primary)">{r.memberName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{timeOf(r.checkInAt)}</td>
                          <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{timeOf(r.checkOutAt)}</td>
                          <td className="px-5 py-4 text-(--text-secondary)">{r.source ?? "—"}</td>
                          <td className="px-5 py-4">
                            <StatusPill tone={inside ? "live" : "neutral"} size="sm">
                              {inside ? "Inside" : "Left"}
                            </StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
