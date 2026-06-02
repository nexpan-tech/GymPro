import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/forms/Select";
import Input from "@/components/forms/Input";
import SearchInput from "@/components/common/SearchInput";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRole } from "@/hooks/useRole";
import {
  auditService,
  type AuditLog,
  type AuditActionType,
} from "@/services/audit.service";

const ACTION_OPTIONS: { label: string; value: string }[] = [
  { label: "All actions", value: "ALL" },
  { label: "Login", value: "LOGIN" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Create", value: "CREATE" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Check-in", value: "CHECK_IN" },
];

function actionVariant(
  action: AuditActionType
): "primary" | "info" | "success" | "warning" | "danger" | "default" {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "danger";
    case "LOGIN":
      return "primary";
    case "PAYMENT":
      return "warning";
    default:
      return "default";
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const { isSuperAdmin } = useRole();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [since, setSince] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditService.list();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError("We couldn't load audit logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sinceTime = since ? new Date(since).getTime() : null;
    return logs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (sinceTime && new Date(log.createdAt).getTime() < sinceTime) return false;
      if (query) {
        const haystack = [
          log.entityType,
          log.path,
          log.gymId,
          log.userId,
          log.action,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter, since]);

  return (
    <Page
      title="Audit Logs"
      description={
        isSuperAdmin
          ? "Platform-wide activity across all gyms."
          : "Activity recorded for your gym."
      }
      action={
        <Button variant="secondary" onClick={() => void loadLogs()}>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <Card variant="solid" className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search entity, path, gym, or user"
              />
            </div>
            <Select
              options={ACTION_OPTIONS}
              value={actionFilter}
              placeholder="All actions"
              onChange={(e) => setActionFilter(e.target.value)}
            />
            <Input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="h-10" />
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            title="Couldn't load audit logs"
            message={error}
            action={
              <Button variant="secondary" onClick={() => void loadLogs()}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-7 w-7" />}
            title={logs.length === 0 ? "No audit activity yet" : "No matching entries"}
            message={
              logs.length === 0
                ? "Actions like logins and resource changes will appear here."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Entity</th>
                    <th className="px-5 py-3 font-medium">Path</th>
                    {isSuperAdmin && <th className="px-5 py-3 font-medium">Gym</th>}
                    <th className="px-5 py-3 font-medium">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-3 whitespace-nowrap text-(--text-secondary)">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-5 py-3 text-(--text-primary)">
                        {log.entityType ?? "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-(--text-secondary)">
                        {log.method ? `${log.method} ` : ""}
                        {log.path ?? "—"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-5 py-3 text-xs text-(--text-secondary)">
                          {log.gymId ?? "—"}
                        </td>
                      )}
                      <td className="px-5 py-3 text-xs text-(--text-secondary)">
                        {log.userId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}
