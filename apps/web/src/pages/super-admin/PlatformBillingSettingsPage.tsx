import { useCallback, useEffect, useState } from "react";
import { Building2, Receipt, Landmark, FileText, Save } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import Input from "@/components/forms/Input";
import Textarea from "@/components/forms/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService, type PlatformBillingSettings } from "@/services/superAdmin.service";

type Form = Record<string, string>;

const FIELDS: { group: string; icon: React.ReactNode; items: { key: keyof PlatformBillingSettings; label: string; type?: string; full?: boolean }[] }[] = [
  {
    group: "Company information", icon: <Building2 className="h-4 w-4 text-primary" />,
    items: [
      { key: "companyName", label: "Company name" },
      { key: "companyWebsite", label: "Website" },
      { key: "companyEmail", label: "Email" },
      { key: "companyPhone", label: "Phone" },
      { key: "companyLogo", label: "Logo URL" },
      { key: "companyAddress", label: "Address", full: true },
    ],
  },
  {
    group: "Tax information", icon: <Receipt className="h-4 w-4 text-primary" />,
    items: [
      { key: "gstNumber", label: "GST number" },
      { key: "defaultGstPercent", label: "Default GST %", type: "number" },
      { key: "panNumber", label: "PAN number" },
      { key: "cinNumber", label: "CIN number (optional)" },
    ],
  },
  {
    group: "Bank details", icon: <Landmark className="h-4 w-4 text-primary" />,
    items: [
      { key: "accountName", label: "Account name" },
      { key: "accountNumber", label: "Account number" },
      { key: "bankName", label: "Bank name" },
      { key: "ifscCode", label: "IFSC code" },
      { key: "upiId", label: "UPI ID" },
    ],
  },
  {
    group: "Invoice settings", icon: <FileText className="h-4 w-4 text-primary" />,
    items: [
      { key: "invoicePrefix", label: "Invoice prefix" },
      { key: "dueDays", label: "Due days", type: "number" },
      { key: "paymentTerms", label: "Payment terms" },
      { key: "invoiceFooter", label: "Invoice footer", full: true },
    ],
  },
];

const NUMERIC = new Set(["defaultGstPercent", "dueDays"]);

export default function PlatformBillingSettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<Form>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await superAdminService.getSettings();
      const f: Form = {};
      for (const group of FIELDS) for (const item of group.items) {
        const v = (s as any)[item.key];
        f[item.key as string] = v == null ? "" : String(v);
      }
      setForm(f);
    } catch {
      toast.error("Failed to load billing settings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const group of FIELDS) for (const item of group.items) {
        const raw = form[item.key as string] ?? "";
        if (NUMERIC.has(item.key as string)) payload[item.key as string] = raw === "" ? 0 : Number(raw);
        else payload[item.key as string] = raw;
      }
      await superAdminService.updateSettings(payload);
      toast.success("Billing settings saved. Future invoices will use these values.");
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title="Platform Billing Settings"
      eyebrow="Config"
      description="Nexpan Tech billing identity — used on every future SaaS invoice. Past invoices keep their original values."
      action={<Button iconLeft={<Save className="h-4 w-4" />} loading={saving} onClick={() => void save()}>Save settings</Button>}
    >
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-40" />)}</div>
      ) : (
        <div className="space-y-8">
          {FIELDS.map((group) => (
            <div key={group.group} className="surface-card p-5">
              <SectionHeader eyebrow={undefined} title={<span className="flex items-center gap-2">{group.icon}{group.group}</span>} />
              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.key as string} className={item.full ? "sm:col-span-2" : ""}>
                    {item.key === "invoiceFooter" || item.key === "companyAddress" ? (
                      <Textarea
                        label={item.label}
                        rows={2}
                        value={form[item.key as string] ?? ""}
                        onChange={(e) => setForm({ ...form, [item.key as string]: e.target.value })}
                      />
                    ) : (
                      <Input
                        label={item.label}
                        type={item.type ?? "text"}
                        value={form[item.key as string] ?? ""}
                        onChange={(e) => setForm({ ...form, [item.key as string]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
