import { motion } from "framer-motion";

type ChallengeItem = {
  title: string;
  description?: string;
  progress?: number;
  targetValue?: number;
};

type ChallengeCarouselProps = {
  items?: ChallengeItem[];
};

export function ChallengeCarousel({ items = [] }: ChallengeCarouselProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-white">Active Challenges</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No active challenges yet.</p>
        ) : (
          items.map((item, index) => {
            const progress =
              item.targetValue && item.targetValue > 0
                ? Math.min(((item.progress || 0) / item.targetValue) * 100, 100)
                : 0;

            return (
              <motion.div
                key={`${item.title}-${index}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                className="min-w-[260px] rounded-2xl bg-slate-950 p-5"
              >
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {item.description || "Stay consistent and climb the ranks."}
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {item.progress || 0}/{item.targetValue || 0}
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}