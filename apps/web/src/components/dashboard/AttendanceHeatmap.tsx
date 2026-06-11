// apps/web/src/components/dashboard/AttendanceHeatmap.tsx

import { Card } from "@/components/ui/Card";

interface HeatmapDay {
  day: string;
  value: number; // 0 - 4 intensity
}

interface AttendanceTrendDay {
  date: string;
  present: number;
  absent?: number;
}

interface AttendanceHeatmapProps {
  data?: Array<HeatmapDay | AttendanceTrendDay>;
}

const defaultData: HeatmapDay[] = [
  { day: "Mon", value: 4 },
  { day: "Tue", value: 3 },
  { day: "Wed", value: 4 },
  { day: "Thu", value: 2 },
  { day: "Fri", value: 4 },
  { day: "Sat", value: 3 },
  { day: "Sun", value: 1 },
];

function getIntensityClass(value: number) {
  const classes = [
    "bg-muted dark:bg-muted",
    "bg-muted dark:bg-muted-foreground",
    "bg-muted dark:bg-muted-foreground",
    "bg-muted-foreground dark:bg-muted-foreground",
    "bg-muted-foreground dark:bg-muted-foreground",
  ];

  return classes[Math.max(0, Math.min(value, 4))];
}

function isHeatmapDay(
  item: HeatmapDay | AttendanceTrendDay
): item is HeatmapDay {
  return "day" in item && typeof item.day === "string";
}

function normalizeAttendanceData(
  item: HeatmapDay | AttendanceTrendDay
): HeatmapDay {
  if (isHeatmapDay(item)) {
    return item;
  }

  const label = item.date ? item.date.slice(0, 3) : "Day";
  const value = Math.max(0, Math.min(4, Math.round(item.present ?? 0)));

  return {
    day: label,
    value,
  };
}

export default function AttendanceHeatmap({
  data = defaultData,
}: AttendanceHeatmapProps) {
  const chartData = Array.isArray(data)
    ? data.map(normalizeAttendanceData)
    : defaultData;

  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          Attendance Heatmap
        </h3>
        <p className="text-sm text-muted-foreground">
          Weekly attendance intensity
        </p>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {chartData.map((item) => (
          <div key={item.day} className="text-center">
            <div
              className={`h-12 rounded-2xl shadow-sm ${getIntensityClass(
                item.value
              )}`}
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {item.day}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-3 w-6 rounded ${getIntensityClass(level)}`}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </Card>
  );
}