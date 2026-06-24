import { useEffect, useState } from "react";
import { User, Mail, Building2, Shield } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { getRoleLabel } from "@/config/navigation";

interface MeDetail {
  name?: string; email?: string; role?: string; phone?: string | null;
  gym?: { name?: string; email?: string | null; address?: string | null } | null;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [me, setMe] = useState<MeDetail | null>(null);

  useEffect(() => {
    let active = true;
    // /auth/me includes the gym + phone (more than the cached store user).
    authService.getProfile()
      .then((res) => { if (active) setMe(res.data as unknown as MeDetail); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const name = me?.name ?? user?.name ?? "—";
  const email = me?.email ?? user?.email ?? "—";
  const role = me?.role ?? user?.role ?? "";
  const initials = name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "GP";

  return (
    <Page title="Profile" eyebrow="Account" description="Your account details.">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity */}
        <Card variant="solid" className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-black text-primary ring-1 ring-primary/20">{initials}</div>
            <p className="mt-3 text-lg font-bold text-(--text-primary)">{name}</p>
            <p className="text-sm text-(--text-secondary)">{email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Shield className="h-3 w-3" /> {getRoleLabel(role)}</span>
          </div>
        </Card>

        {/* Details */}
        <Card variant="solid" className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-(--text-primary)">Account details</h3>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Field icon={<User className="h-4 w-4 text-primary" />} label="Name" value={name} />
            <Field icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value={email} />
            <Field icon={<Shield className="h-4 w-4 text-primary" />} label="Role" value={getRoleLabel(role)} />
            <Field icon={<User className="h-4 w-4 text-primary" />} label="Phone" value={me?.phone ?? "—"} />
            <Field icon={<Building2 className="h-4 w-4 text-primary" />} label="Gym" value={me?.gym?.name ?? "—"} />
            <Field icon={<Building2 className="h-4 w-4 text-primary" />} label="Gym address" value={me?.gym?.address ?? "—"} />
          </dl>
          {/* Password changes are managed by an administrator (role hierarchy) —
              there is no self-service password change. */}
          <p className="mt-5 border-t border-border pt-4 text-xs text-(--text-muted)">
            Need a password change? Contact your administrator — passwords are managed for you and are never shown or self-served.
          </p>
        </Card>
      </div>
    </Page>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-(--text-muted)">{icon}{label}</dt>
      <dd className="mt-0.5 font-medium text-(--text-primary)">{value}</dd>
    </div>
  );
}
