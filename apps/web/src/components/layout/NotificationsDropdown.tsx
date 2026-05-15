// src/components/layout/NotificationsDropdown.tsx
import { Bell } from "lucide-react";
import { useState } from "react";

const mockNotifications = [
  {
    id: 1,
    title: "Membership Expiring",
    message: "Arun Kumar's membership expires tomorrow.",
    time: "10 min ago",
  },
  {
    id: 2,
    title: "Payment Received",
    message: "₹2,500 received from Priya.",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "New Member Registered",
    message: "Karthik joined Gold Plan.",
    time: "3 hours ago",
  },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 z-50">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {mockNotifications.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
              </div>
            ))}
          </div>

          <button className="w-full px-4 py-3 text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-800">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}