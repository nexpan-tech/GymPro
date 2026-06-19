import { describe, it, expect } from "vitest";
import { computeAttendanceStreaks } from "../../modules/attendance/attendance-streak";

// Fixed week for deterministic weekday math (UTC):
//   2026-01-05 Mon, -06 Tue, -07 Wed, -08 Thu, -09 Fri, -10 Sat, -11 Sun(closed),
//   2026-01-12 Mon, -13 Tue
const d = (s: string) => new Date(`${s}T08:00:00.000Z`);

describe("computeAttendanceStreaks — operational-day engine (Sundays excluded)", () => {
  it("keeps the streak across a closed Sunday (Mon–Sat + next Mon = 7)", () => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-12"].map(d);
    const s = computeAttendanceStreaks(dates, { today: d("2026-01-12") });
    expect(s.current).toBe(7); // Sunday 01-11 skipped, not a break
    expect(s.best).toBe(7);
    expect(s.lastAttendedDate).toBe("2026-01-12");
  });

  it("is forgiving about today: an operational day not yet attended does not break the streak", () => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-12"].map(d);
    const s = computeAttendanceStreaks(dates, { today: d("2026-01-13") }); // Tue, not attended yet
    expect(s.current).toBe(7);
  });

  it("breaks the streak when an OPERATIONAL day is missed", () => {
    // Missed Thu 01-08.
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-09", "2026-01-10"].map(d);
    const s = computeAttendanceStreaks(dates, { today: d("2026-01-10") });
    expect(s.current).toBe(2); // 01-10, 01-09 then 01-08 missing
    expect(s.best).toBe(3);    // 01-05,06,07
  });

  it("ignores attendance logged on a closed Sunday (does not count toward streaks)", () => {
    const s = computeAttendanceStreaks([d("2026-01-11")], { today: d("2026-01-12") });
    expect(s.current).toBe(0);
    expect(s.best).toBe(0);
    expect(s.totalDaysAttended).toBe(1);
  });

  it("computes monthly attendance + consistency excluding Sundays", () => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-12"].map(d);
    const s = computeAttendanceStreaks(dates, { today: d("2026-01-12") });
    // Operational days 01-01..01-12 excluding Sundays 01-04 & 01-11 = 10.
    expect(s.thisMonth.operationalDays).toBe(10);
    expect(s.thisMonth.attended).toBe(7);
    expect(s.thisMonth.consistency).toBe(70);
    expect(s.thisMonth.streak).toBe(7);
  });

  it("returns all-zero summary for a member with no attendance", () => {
    const s = computeAttendanceStreaks([], { today: d("2026-01-12") });
    expect(s).toMatchObject({ current: 0, best: 0, totalDaysAttended: 0, lastAttendedDate: null });
    expect(s.thisMonth.attended).toBe(0);
    expect(s.thisYear.attended).toBe(0);
  });

  it("deduplicates multiple check-ins on the same day", () => {
    const s = computeAttendanceStreaks([d("2026-01-05"), d("2026-01-05"), d("2026-01-06")], { today: d("2026-01-06") });
    expect(s.current).toBe(2);
    expect(s.totalDaysAttended).toBe(2);
  });
});
