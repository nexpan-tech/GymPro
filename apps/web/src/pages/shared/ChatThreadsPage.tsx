import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/common/EmptyState";
import { useSocket } from "@/hooks/useSocket";
import { chatService, type ChatThread, type ChatMessage } from "@/services/comms.service";

/** Trainer / admin chat: list of member threads + conversation pane (realtime). */
export default function ChatThreadsPage() {
  const { on } = useSocket();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadThreads() { setThreads(await chatService.threads().catch(() => [])); }
  useEffect(() => { void loadThreads(); }, []);

  async function openThread(t: ChatThread) {
    setActive(t);
    setMessages(await chatService.memberMessages(t.memberId).catch(() => []));
    await chatService.markRead(t.memberId).catch(() => undefined);
    void loadThreads();
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime: append incoming messages for the open thread; refresh thread list.
  useEffect(() => {
    const off = on<ChatMessage>("chat.message", (msg) => {
      if (active && msg.memberId === active.memberId) {
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      }
      void loadThreads();
    });
    return off;
  }, [on, active]);

  async function send() {
    if (!draft.trim() || !active) return;
    const text = draft.trim();
    setDraft("");
    const sent = await chatService.send({ memberId: active.memberId, message: text }).catch(() => null);
    if (sent) setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    void loadThreads();
  }

  return (
    <Page title="Member Chat" description="Message your members in real time.">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Threads */}
        <Card variant="solid" className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-(--text-primary)">Conversations</div>
          {threads.length === 0 ? (
            <p className="px-4 py-6 text-sm text-(--text-secondary)">No conversations yet.</p>
          ) : (
            <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {threads.map((t) => (
                <button key={t.memberId} onClick={() => openThread(t)} className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-(--surface-elevated) ${active?.memberId === t.memberId ? "bg-(--surface-elevated)" : ""}`}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-(--text-primary)">{t.name}</div>
                    <div className="truncate text-xs text-(--text-secondary)">{t.lastMessage ?? ""}</div>
                  </div>
                  {t.unread > 0 && <Badge variant="danger">{t.unread}</Badge>}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Conversation */}
        <Card variant="solid" className="flex h-[60vh] flex-col p-0">
          {!active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="Select a conversation" message="Pick a member to start chatting." />
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3 text-sm font-semibold text-(--text-primary)">{active.name}</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.sender?.role !== "MEMBER";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-(--surface-elevated) text-(--text-primary)"}`}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input className="flex-1" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button iconLeft={<Send className="h-4 w-4" />} onClick={send}>Send</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}
