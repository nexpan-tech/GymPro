import { useEffect, useState } from "react";
import { Send, Megaphone } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { commsService, type CommChannel, type AnnouncementAudience } from "@/services/comms.service";

const AUDIENCES: AnnouncementAudience[] = ["ALL", "MEMBERS", "TRAINERS", "STAFF"];
const OPTIONAL_CHANNELS: CommChannel[] = ["PUSH", "EMAIL", "SMS", "WHATSAPP"];

export default function BroadcastPage() {
  const toast = useToast();
  const [availability, setAvailability] = useState<Record<CommChannel, boolean> | null>(null);
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [channels, setChannels] = useState<CommChannel[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ recipients: number; delivery: { sent: number; skipped: number; failed: number } } | null>(null);

  useEffect(() => {
    commsService.channels().then(setAvailability).catch(() => setAvailability(null));
  }, []);

  function toggle(ch: CommChannel) {
    setChannels((c) => (c.includes(ch) ? c.filter((x) => x !== ch) : [...c, ch]));
  }

  async function send() {
    if (!title || !message) { toast.error("Title and message are required"); return; }
    setSending(true);
    try {
      const res = (await commsService.broadcast({ audience, channels, title, message })) as { recipients: number; delivery: { sent: number; skipped: number; failed: number } };
      setResult(res);
      toast.success(`Broadcast sent to ${res.recipients} recipients`);
      setTitle(""); setMessage("");
    } catch { toast.error("Broadcast failed"); } finally { setSending(false); }
  }

  return (
    <Page title="Broadcast Center" description="Send a message to an audience across in-app, push, email, SMS, or WhatsApp.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="solid" className="space-y-4 p-5">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gym closed on Sunday" />
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Message</label>
            <textarea className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Audience</label>
            <select className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}>
              {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Channels</label>
            <p className="text-xs text-(--text-secondary)">In-app + realtime are always on. Enable extra channels below (disabled = not configured).</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OPTIONAL_CHANNELS.map((ch) => {
                const available = availability?.[ch] ?? false;
                const active = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    disabled={!available}
                    onClick={() => toggle(ch)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      !available ? "cursor-not-allowed border-border text-(--text-secondary) opacity-50"
                      : active ? "border-primary/40 bg-primary text-white"
                      : "border-border text-(--text-secondary) hover:border-primary/40"
                    }`}
                  >
                    {ch}{!available && " (off)"}
                  </button>
                );
              })}
            </div>
          </div>
          <Button iconLeft={<Send className="h-4 w-4" />} loading={sending} onClick={send}>Send Now</Button>
        </Card>

        <Card variant="solid" className="p-5">
          <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-(--text-primary)">Preview</h3></div>
          <div className="mt-3 rounded-lg border border-border p-4">
            <div className="text-sm font-bold text-(--text-primary)">{title || "Your title"}</div>
            <p className="mt-1 text-sm text-(--text-secondary)">{message || "Your message preview appears here."}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge variant="info">{audience}</Badge>
              <Badge variant="default">IN_APP</Badge>
              <Badge variant="default">SOCKET</Badge>
              {channels.map((c) => <Badge key={c} variant="success">{c}</Badge>)}
            </div>
          </div>
          {result && (
            <div className="mt-4 rounded-lg border border-border p-4 text-sm">
              <div className="font-semibold text-(--text-primary)">Last broadcast</div>
              <div className="mt-1 text-(--text-secondary)">Recipients: {result.recipients} · Sent: {result.delivery.sent} · Skipped: {result.delivery.skipped} · Failed: {result.delivery.failed}</div>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
