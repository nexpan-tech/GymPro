/**
 * Attendance streak engine — the single source of truth for member streaks.
 *
 * Derives streaks from real Attendance rows (not a stored counter), so it can
 * never drift. Streaks are measured in **operational days**: days the gym is
 * open. Non-operational days (Sundays by default) are *skipped* — they neither
 * count toward a streak nor break it. So Mon–Sat attended + Sunday closed + Mon
 * attended is an unbroken 7-operational-day streak.
 *
 * `closedWeekdays` uses JS `getUTCDay()` numbering: 0=Sun … 6=Sat. It defaults
 * to `[0]` (Sundays closed). When gyms gain configurable opening days this is
 * the one place to feed them in — every consumer (member streak, leaderboard,
 * progress insights) shares this calculation.
 */

const DAY_MS = 86_400_000;

function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function dayKey(date: Date): string {
  return utcStartOfDay(date).toISOString().slice(0, 10);
}
function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS);
}

export interface PeriodStreak {
  attended: number;        // operational days attended in the period
  operationalDays: number; // operational days elapsed in the period (up to today)
  consistency: number;     // attended / operationalDays, 0..100
  streak: number;          // longest consecutive operational-day run in the period
}

export interface AttendanceStreakSummary {
  current: number;              // consecutive operational days attended, ending today
  best: number;                 // all-time longest operational-day run
  thisMonth: PeriodStreak;
  thisYear: PeriodStreak;
  lastAttendedDate: string | null;
  totalDaysAttended: number;
  closedWeekdays: number[];
}

export interface StreakOptions {
  today?: Date;
  closedWeekdays?: number[]; // JS getUTCDay() numbers; default [0] = Sunday
}

/**
 * Compute the full streak summary from a member's attendance dates.
 * Pure + deterministic — pass `today` in tests for stable results.
 */
export function computeAttendanceStreaks(
  attendanceDates: Date[],
  options: StreakOptions = {},
): AttendanceStreakSummary {
  const closedWeekdays = options.closedWeekdays ?? [0];
  const isClosed = (d: Date) => closedWeekdays.includes(d.getUTCDay());
  const isOperational = (d: Date) => !isClosed(d);

  const today = utcStartOfDay(options.today ?? new Date());

  // Unique attended day-keys.
  const attended = new Set<string>();
  for (const d of attendanceDates) attended.add(dayKey(new Date(d)));
  const attendedOn = (d: Date) => attended.has(dayKey(d));

  // Earliest attended day bounds the backward/forward scans.
  let earliest: Date | null = null;
  let lastAttended: Date | null = null;
  for (const key of attended) {
    const d = new Date(`${key}T00:00:00.000Z`);
    if (!earliest || d < earliest) earliest = d;
    if (!lastAttended || d > lastAttended) lastAttended = d;
  }

  // ── Current streak ──────────────────────────────────────────────────────────
  // Walk backward from today. Skip closed days (no effect). On an operational
  // day: attended → extend; not attended → stop. Today is forgiving: if it is an
  // operational day not yet attended, it doesn't break the streak (the day isn't
  // over) — we just start counting from the previous operational day.
  let current = 0;
  if (earliest) {
    let cursor = new Date(today);
    if (isOperational(cursor) && !attendedOn(cursor)) cursor = addDays(cursor, -1);
    while (cursor >= earliest) {
      if (isClosed(cursor)) { cursor = addDays(cursor, -1); continue; }
      if (attendedOn(cursor)) { current += 1; cursor = addDays(cursor, -1); }
      else break;
    }
  }

  // ── Best streak (all-time) + period scans ───────────────────────────────────
  let best = 0;
  if (earliest) {
    let run = 0;
    for (let cursor = new Date(earliest); cursor <= today; cursor = addDays(cursor, 1)) {
      if (isClosed(cursor)) continue;
      if (attendedOn(cursor)) { run += 1; best = Math.max(best, run); }
      else run = 0;
    }
  }

  const period = (start: Date): PeriodStreak => {
    let attendedCount = 0;
    let operationalDays = 0;
    let run = 0;
    let streak = 0;
    for (let cursor = new Date(start); cursor <= today; cursor = addDays(cursor, 1)) {
      if (isClosed(cursor)) continue;
      operationalDays += 1;
      if (attendedOn(cursor)) { attendedCount += 1; run += 1; streak = Math.max(streak, run); }
      else run = 0;
    }
    return {
      attended: attendedCount,
      operationalDays,
      consistency: operationalDays > 0 ? Math.round((attendedCount / operationalDays) * 100) : 0,
      streak,
    };
  };

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

  return {
    current,
    best,
    thisMonth: period(monthStart),
    thisYear: period(yearStart),
    lastAttendedDate: lastAttended ? dayKey(lastAttended) : null,
    totalDaysAttended: attended.size,
    closedWeekdays,
  };
}
