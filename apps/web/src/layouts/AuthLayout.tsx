// src/layouts/AuthLayout.tsx
import { type PropsWithChildren } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 to-indigo-700 text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold">GymPro</h1>
          <p className="mt-4 text-lg text-blue-100">
            Complete Gym Management SaaS for Gym Owners, Trainers, and Members.
          </p>
        </div>

        <div className="space-y-4 text-sm text-blue-100">
          <p>✓ Member Management</p>
          <p>✓ Attendance Tracking</p>
          <p>✓ Billing & Renewals</p>
          <p>✓ Workout & Diet Plans</p>
          <p>✓ Analytics Dashboard</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="w-full max-w-md">
          <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{title}</h1>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}