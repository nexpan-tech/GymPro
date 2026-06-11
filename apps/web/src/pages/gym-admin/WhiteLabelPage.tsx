import { useEffect, useState } from "react";
import { Palette, Save } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { whiteLabelService, type WhiteLabel } from "@/services/enterprise.service";

export default function WhiteLabelPage() {
  const toast = useToast();
  const [form, setForm] = useState<WhiteLabel>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    whiteLabelService.get().then((s) => setForm(s ?? {})).catch(() => setForm({})).finally(() => setLoading(false));
  }, []);

  function set<K extends keyof WhiteLabel>(k: K, v: WhiteLabel[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try { await whiteLabelService.upsert(form); toast.success("Branding saved"); }
    catch { toast.error("Save failed"); } finally { setSaving(false); }
  }

  if (loading) return <Page title="White-Label Branding"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="White-Label Branding" description="Customise your gym's app branding, colors, and email identity (stored config only)."
      action={<Button iconLeft={<Save className="h-4 w-4" />} loading={saving} onClick={save}>Save</Button>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="solid" className="space-y-4 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)"><Palette className="h-4 w-4 text-primary" /> App branding</h3>
          <Input label="App name" value={form.appName ?? ""} onChange={(e) => set("appName", e.target.value)} />
          <Input label="Mobile app name" value={form.mobileAppName ?? ""} onChange={(e) => set("mobileAppName", e.target.value)} />
          <Input label="Logo URL" value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…/logo.png" />
          <Input label="Favicon URL" value={form.faviconUrl ?? ""} onChange={(e) => set("faviconUrl", e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" value={form.primaryColor} onChange={(v) => set("primaryColor", v)} />
            <ColorField label="Secondary" value={form.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
            <ColorField label="Accent" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
          </div>
        </Card>

        <Card variant="solid" className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-(--text-primary)">Email branding</h3>
          <Input label="Email from name" value={form.emailFromName ?? ""} onChange={(e) => set("emailFromName", e.target.value)} placeholder="e.g. FitZone Gym" />
          <Input label="Email logo URL" value={form.emailLogoUrl ?? ""} onChange={(e) => set("emailLogoUrl", e.target.value)} />
          <Input label="Support email" value={form.supportEmail ?? ""} onChange={(e) => set("supportEmail", e.target.value)} />
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Email footer text</label>
            <textarea className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" rows={3} value={form.emailFooterText ?? ""} onChange={(e) => set("emailFooterText", e.target.value)} />
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs uppercase tracking-wide text-(--text-secondary)">Preview</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded" style={{ background: form.primaryColor || "#e73725" }} />
              <span className="font-bold text-(--text-primary)">{form.appName || "GymPro"}</span>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-(--text-secondary)">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value || "#e73725"} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 rounded border border-border bg-transparent" />
        <input className="w-full rounded-md border border-border bg-(--surface) px-2 py-1 text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#e73725" />
      </div>
    </div>
  );
}
