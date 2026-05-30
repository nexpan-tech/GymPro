// All providers (ErrorBoundary, QueryClient, Theme, Auth, Toast)
// are mounted in main.tsx via <AppProviders>. App.tsx renders only the router.
import { AppRouter } from "@/routes";

export default function App() {
  return <AppRouter />;
}