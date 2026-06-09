import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { invoiceService, type Invoice } from "@/services/invoice.service";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    invoiceService
      .listMine()
      .then((data) => active && setInvoices(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="text-(--text-secondary)">Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Your GST invoices for memberships and payments." />

      {invoices.length === 0 ? (
        <Card variant="glass">
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-8 w-8 text-(--text-muted)" />
              <p className="text-sm text-(--text-secondary)">No invoices yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((i) => (
            <Card key={i.id} variant="glass">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-(--text-primary)">{i.invoiceNumber}</p>
                    <p className="text-xs text-(--text-secondary)">{new Date(i.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={i.status === "PAID" ? "success" : "info"}>{i.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Field label="Subtotal" value={inr(i.subtotal)} />
                  {i.igst > 0 ? (
                    <Field label={`IGST (${i.gstPercent}%)`} value={inr(i.igst)} />
                  ) : (
                    <>
                      <Field label={`CGST (${i.gstPercent / 2}%)`} value={inr(i.cgst)} />
                      <Field label={`SGST (${i.gstPercent / 2}%)`} value={inr(i.sgst)} />
                    </>
                  )}
                  <Field label="Total" value={inr(i.totalAmount)} strong />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs text-(--text-secondary)">{label}</p>
      <p className={strong ? "font-bold text-(--text-primary)" : "text-(--text-primary)"}>{value}</p>
    </div>
  );
}
