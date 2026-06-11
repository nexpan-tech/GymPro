import { APP_CONFIG } from "@/config/app.config";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-muted px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-white p-10 shadow-xl dark:border-border dark:bg-muted">
        <h1 className="text-5xl font-bold text-foreground dark:text-white">
          {APP_CONFIG.appName}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          {APP_CONFIG.appDescription}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/login"
            className="rounded-2xl border border-border bg-muted px-6 py-5 text-center font-medium text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-white dark:hover:bg-muted"
          >
            Login
          </Link>
          <Link
            to="/register-gym"
            className="rounded-2xl border border-transparent bg-black px-6 py-5 text-center font-medium text-white hover:bg-muted"
          >
            Register Gym
          </Link>
        </div>
      </div>
    </div>
  );
}
