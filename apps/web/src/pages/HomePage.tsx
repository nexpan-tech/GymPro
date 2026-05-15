import { APP_CONFIG } from "@/config/app.config";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-10 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          {APP_CONFIG.appName}
        </h1>

        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          {APP_CONFIG.appDescription}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/login"
            className="rounded-2xl border border-gray-300 bg-gray-100 px-6 py-5 text-center font-medium text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-800"
          >
            Login
          </Link>
          <Link
            to="/register-gym"
            className="rounded-2xl border border-transparent bg-black px-6 py-5 text-center font-medium text-white hover:bg-gray-900"
          >
            Register Gym
          </Link>
        </div>
      </div>
    </div>
  );
}
