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
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-muted p-3 text-muted-foreground dark:bg-muted dark:text-muted-foreground">
          <Award className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Top Trainers
          </h3>
          <p className="text-sm text-muted-foreground">
            Best performing trainers this month
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((trainer, index) => (
          <div
            key={trainer.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary text-sm font-bold text-white shadow-lg">
                #{index + 1}
              </div>

              <div>
                <h4 className="font-semibold text-foreground dark:text-white">
                  {trainer.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {trainer.specialization}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-muted-foreground">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">
                  {trainer.rating}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
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