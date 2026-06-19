import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Flame, Medal, Trophy } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import {
  gamificationService,
  type LeaderboardRow,
} from "@/services/gamification.service";
import { memberService } from "@/services/member.service";

const MEDAL = ["text-(--flame)", "text-(--text-secondary)", "text-amber-700"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Premium gym-scoped leaderboard. Backend enforces gym isolation (no cross-gym). */
export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"ALL" | "MONTH">("MONTH");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      gamificationService.leaderboard("GYM", undefined, period).catch(() => [] as LeaderboardRow[]),
      memberService.getMyProfile().then((m) => m?.id ?? null).catch(() => null),
    ]).then(([r, id]) => {
      if (!active) return;
      setRows(r);
      setMyId(id);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [period]);

  const myRow = useMemo(() => rows.find((r) => r.memberId === myId) ?? null, [rows, myId]);
  const podium = rows.slice(0, 3);
  // Visual podium order: 2nd, 1st, 3rd (center is tallest).
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as LeaderboardRow[];
  const heights = ["h-24", "h-32", "h-20"];

  const periodToggle = (
    <div className="flex gap-1 rounded-full bg-(--surface-secondary) p-1">
      {(["MONTH", "ALL"] as const).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${period === p ? "bg-(--flame) text-white" : "text-(--text-secondary)"}`}
        >
          {p === "MONTH" ? "This Month" : "All-Time"}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Page title="Leaderboard" description="See how you rank against your gym." action={periodToggle}>
        <div className="space-y-6">
          <Skeleton height="h-40" />
          <Skeleton height="h-64" />
        </div>
      </Page>
    );
  }

  if (rows.length === 0) {
    return (
      <Page title="Leaderboard" description="See how you rank against your gym." action={periodToggle}>
        <EmptyState
          icon={<Trophy className="h-7 w-7" />}
          title="No rankings yet"
          message="Check in, complete workouts, and earn XP to climb the leaderboard."
        />
      </Page>
    );
  }

  return (
    <Page title="Leaderboard" description="Gym-wide rankings by XP, streaks, and consistency." action={periodToggle}>
      <div className="space-y-6">
        {/* Your standing */}
        {myRow && (
          <Card variant="solid" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-(--flame)/15 text-lg font-bold text-(--flame)">
                #{myRow.rank}
              </div>
              <div>
                <p className="text-sm text-(--text-secondary)">Your rank</p>
                <p className="text-lg font-semibold text-(--text-primary)">{myRow.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-right">
              <div>
                <p className="text-lg font-bold text-(--text-primary)">{myRow.xp ?? 0}</p>
                <p className="text-xs text-(--text-secondary)">XP</p>
              </div>
              <div className="flex items-center gap-1 text-(--flame)">
                <Flame className="h-4 w-4" />
                <span className="font-semibold">{myRow.streak ?? 0}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Podium */}
        <Card variant="solid" className="p-6">
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {podiumOrder.map((row) => {
              const place = row.rank - 1; // 0,1,2
              return (
                <motion.div
                  key={row.memberId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * row.rank }}
                  className="flex w-24 flex-col items-center sm:w-28"
                >
                  {row.rank === 1 && <Crown className="mb-1 h-6 w-6 text-(--flame)" />}
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-base font-bold text-(--text-primary) ring-2 ring-border">
                    {initials(row.name)}
                  </div>
                  <p className="mt-2 max-w-full truncate text-sm font-semibold text-(--text-primary)">{row.name}</p>
                  <p className="text-xs text-(--text-secondary)">{row.xp ?? 0} XP</p>
                  <div className={`mt-2 w-full rounded-t-xl bg-(--flame)/15 ${heights[place]} flex items-start justify-center pt-2`}>
                    <Medal className={`h-5 w-5 ${MEDAL[place]}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Full ranking */}
        <Card variant="solid" className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const isMe = row.memberId === myId;
              return (
                <li
                  key={row.memberId}
                  className={`flex items-center justify-between px-5 py-3 ${isMe ? "bg-(--flame)/10" : "hover:bg-(--surface-hover)"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-semibold text-(--text-secondary)">{row.rank}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold text-(--text-primary)">
                      {initials(row.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">
                        {row.name}{isMe && <span className="ml-2 text-xs text-(--flame)">You</span>}
                      </p>
                      <p className="text-xs text-(--text-secondary)">Level {row.level ?? 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1 text-sm text-(--text-secondary)">
                      <Flame className="h-3.5 w-3.5 text-(--flame)" />
                      {row.streak ?? 0}
                    </span>
                    <span className="w-16 text-right text-sm font-bold text-(--text-primary)">{row.xp ?? 0} XP</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
