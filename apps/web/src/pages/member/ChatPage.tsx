import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { chatService, type ChatMessage } from "@/services/comms.service";

/** Member chat with their assigned trainer (single thread, realtime). */
export default function MemberChatPage() {
  const { user } = useAuthStore();
  const { on } = useSocket();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const t = await chatService.myThread().catch(() => null);
    if (t) { setMemberId(t.memberId); setTrainerId(t.trainerId); setMessages(t.messages); }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const off = on<ChatMessage>("chat.message", (msg) => {
      if (!memberId || msg.memberId === memberId) setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
    });
    return off;
  }, [on, memberId]);

  async function send() {
    if (!draft.trim() || !memberId) return;
    const text = draft.trim();
    setDraft("");
    const sent = await chatService.send({ memberId, message: text }).catch(() => null);
    if (sent) setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
  }

  if (loading) return <Page title="Chat with Trainer"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Chat with Trainer" description={trainerId ? "Message your trainer in real time." : "You don't have an assigned trainer yet."}>
      <Card variant="solid" className="flex h-[65vh] flex-col p-0">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-(--text-secondary)">No messages yet. Say hello 👋</p>
          ) : messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-indigo-500 text-white" : "bg-(--surface-elevated) text-(--text-primary)"}`}>{m.message}</div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t border-(--border) p-3">
          <Input className="flex-1" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={!memberId} />
          <Button iconLeft={<Send className="h-4 w-4" />} onClick={send} disabled={!memberId}>Send</Button>
        </div>
      </Card>
    </Page>
  );
}
