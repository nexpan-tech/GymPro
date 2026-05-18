// apps/web/src/components/dashboard/TopTrainers.tsx

import { Award, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface Trainer {
  id: number;
  name: string;
  specialization: string;
  members: number;
  rating: number;
}

interface TopTrainersProps {
  data?: Trainer[];
}

const defaultData: Trainer[] = [
  {
    id: 1,
    name: "Arun Kumar",
    specialization: "Strength Training",
    members: 42,
    rating: 4.9,
  },
  {
    id: 2,
    name: "Priya Sharma",
    specialization: "Weight Loss",
    members: 37,
    rating: 4.8,
  },
  {
    id: 3,
    name: "Vikram Raj",
    specialization: "CrossFit",
    members: 29,
    rating: 4.7,
  },
];

export default function TopTrainers({
  data = defaultData,
}: TopTrainersProps) {
  return (
    <Card className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Award className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Top Trainers
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Best performing trainers this month
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((trainer, index) => (
          <div
            key={trainer.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg">
                #{index + 1}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {trainer.name}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {trainer.specialization}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">
                  {trainer.rating}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Users className="h-3 w-3" />
                {trainer.members} members
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}