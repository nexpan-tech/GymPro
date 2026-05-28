import { motion } from "framer-motion";

type XPProgressRingProps = {
  xp: number;
  level: number;
};

export function XPProgressRing({ xp, level }: XPProgressRingProps) {
  const progress = xp % 100;
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90">
        <circle
          cx="72"
          cy="72"
          r="48"
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-slate-800"
        />

        <motion.circle
          cx="72"
          cy="72"
          r="48"
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeLinecap="round"
          className="text-emerald-400"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-3xl font-bold">{level}</p>
        <p className="text-xs text-slate-400">{progress}/100 XP</p>
      </div>
    </div>
  );
}