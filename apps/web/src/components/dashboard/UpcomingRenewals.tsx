// apps/web/src/components/dashboard/UpcomingRenewals.tsx

import { AlertCircle, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface Renewal {
  id: number;
  name: string;
  expiryDate: string;
  daysLeft: number;
  amount: number;
}

interface UpcomingRenewalsProps {
  data?: Renewal[];
}

const defaultData: Renewal[] = [
  {
    id: 1,
    name: "Ramesh Kumar",
    expiryDate: "20 May 2026",
    daysLeft: 2,
    amount: 2500,
  },
  {
    id: 2,
    name: "Sneha Devi",
    expiryDate: "22 May 2026",
    daysLeft: 4,
    amount: 3500,
  },
  {
    id: 3,
    name: "Ajith Kumar",
    expiryDate: "25 May 2026",
    daysLeft: 7,
    amount: 2500,
  },
];

export default function UpcomingRenewals({
  data = defaultData,
}: UpcomingRenewalsProps) {
  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15 dark:text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Upcoming Renewals
          </h3>
          <p className="text-sm text-muted-foreground">
            Memberships expiring soon
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-foreground dark:text-white">
                  {item.name}
                </h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  Expires on {item.expiryDate}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-foreground dark:text-white">
                  ₹{item.amount.toLocaleString("en-IN")}
                </p>

                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary dark:bg-primary/15 dark:text-primary">
                  <AlertCircle className="h-3 w-3" />
                  {item.daysLeft} days left
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}