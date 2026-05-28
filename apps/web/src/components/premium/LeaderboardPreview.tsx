import { motion } from "framer-motion";

type LeaderboardItem = {
  rank: number;
  name: string;
  xp: number;
  level: number;
};

type LeaderboardPreviewProps = {
  items?: LeaderboardItem[];
};

export function LeaderboardPreview({ items = [] }: LeaderboardPreviewProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-white">Leaderboard</h2>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No leaderboard data yet.</p>
        ) : (
          items.slice(0, 5).map((item, index) => (
            <motion.div
              key={`${item.rank}-${item.name}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center justify-between rounded-2xl bg-slate-950 p-4"
            >
              <div>
                <p className="font-semibold text-white">
                  #{item.rank} {item.name}
                </p>
                <p className="text-sm text-slate-400">Level {item.level}</p>
              </div>

              <p className="font-bold text-emerald-400">{item.xp} XP</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}