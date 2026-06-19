import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Check, CheckCheck, MessageSquare, User } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { chatService, type ChatMessage, type ChatThread } from "@/services/comms.service";

/**
 * Trainer chat — conversations with the trainer's assigned members. Reuses the
 * existing `chatService` (threads/messages/send/markRead, role-scoped on the
 * backend to the trainer's own members) + the shared socket. Realtime messages,
 * unread counts, read receipts, search. (Phase A — fixes the dead /trainer/chat link.)
 */
export default function TrainerChatPage() {
  const { user } = useAuthStore();
  const { on, socket } = useSocket();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function loadThreads() {
    const list = await chatService.threads().catch(() => [] as ChatThread[]);
    setThreads(list);
    setActiveMemberId((cur) => cur ?? list[0]?.memberId ?? null);
    setLoading(false);
  }
  useEffect(() => { void loadThreads(); }, []);

  useEffect(() => {
    if (!activeMemberId) return;
    void chatService.memberMessages(activeMemberId).then(setMessages).catch(() => setMessages([]));
    void chatService.markRead(activeMemberId).catch(() => undefined);
    setThreads((ts) => ts.map((t) => (t.memberId === activeMemberId ? { ...t, unread: 0 } : t)));
    setTypingFrom(null);
  }, [activeMemberId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime inbound messages: append to the open thread, else bump unread.
  useEffect(() => {
    const off = on<ChatMessage>("chat.message", (msg) => {
      if (msg.senderId === user?.id) return; // our own echo handled on send
      if (msg.memberId === activeMemberId) {
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
        void chatService.markRead(msg.memberId).catch(() => undefined);
      } else {
        setThreads((ts) => ts.map((t) => (t.memberId === msg.memberId ? { ...t, unread: t.unread + 1, lastMessage: msg.message } : t)));
      }
    });
    return off;
  }, [on, activeMemberId, user?.id]);

  // Read receipts from the member.
  useEffect(() => {
    const off = on<{ memberId: string }>("chat.read", (p) => {
      if (p.memberId === activeMemberId) setMessages((m) => m.map((x) => (x.senderId === user?.id ? { ...x, isRead: true } : x)));
    });
    return off;
  }, [on, activeMemberId, user?.id]);

  // Typing from the member (derive their userId from inbound messages).
  const memberUserId = useMemo(
    () => messages.find((m) => m.senderId !== user?.id)?.senderId ?? null,
    [messages, user?.id],
  );
  useEffect(() => {
    const off = on<{ fromUserId: string; isTyping: boolean }>("chat.typing", (p) => {
      if (memberUserId && p.fromUserId === memberUserId) {
        setTypingFrom(p.isTyping ? p.fromUserId : null);
        if (p.isTyping) {
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          typingClearRef.current = setTimeout(() => setTypingFrom(null), 4000);
        }
      }
    });
    return off;
  }, [on, memberUserId]);

  async function send() {
    if (!draft.trim() || !activeMemberId) return;
    const text = draft.trim();
    setDraft("");
    const sent = await chatService.send({ memberId: activeMemberId, message: text }).catch(() => null);
    if (sent) setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    setThreads((ts) => ts.map((t) => (t.memberId === activeMemberId ? { ...t, lastMessage: text } : t)));
  }

  const filtered = useMemo(
    () => threads.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())),
    [threads, search],
  );
  const active = threads.find((t) => t.memberId === activeMemberId) ?? null;

  if (loading) return <Page title="Member Chat"><Skeleton height="h-64" /></Page>;

  if (threads.length === 0) {
    return (
      <Page title="Member Chat" description="Message your assigned members in real time.">
        <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="No conversations yet" message="When your members message you, their conversations appear here." />
      </Page>
    );
  }

  return (
    <Page title="Member Chat" description="Message your assigned members in real time.">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card variant="solid" className="flex max-h-[70vh] flex-col p-0">
          <div className="border-b border-border p-3">
            <Input placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-(--text-secondary)">No members found.</p>
            ) : filtered.map((t) => (
              <button
                key={t.memberId}
                onClick={() => setActiveMemberId(t.memberId)}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition ${activeMemberId === t.memberId ? "bg-(--surface-hover)" : "hover:bg-(--surface-hover)"}`}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--surface-secondary)"><User className="h-4 w-4 text-(--text-secondary)" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-(--text-primary)">{t.name}</p>
                    {t.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--flame) px-1 text-xs font-bold text-white">{t.unread}</span>}
                  </div>
                  {t.lastMessage && <p className="truncate text-xs text-(--text-muted)">{t.lastMessage}</p>}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card variant="solid" className="flex h-[70vh] flex-col p-0">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-(--surface-secondary)"><User className="h-4 w-4 text-(--text-secondary)" /></div>
                <div>
                  <p className="text-sm font-semibold text-(--text-primary)">{active.name}</p>
                  <p className="text-xs text-(--text-muted)">{typingFrom ? <span className="text-(--flame)">typing…</span> : "Your member"}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-(--text-secondary)">No messages yet. Say hello 👋</p>
                ) : messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-(--surface-elevated) text-(--text-primary)"}`}>
                        {m.message}
                        {mine && <span className="ml-1 inline-flex translate-y-0.5 text-white/70">{m.isRead ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}</span>}
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
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-(--text-secondary)">Select a member to start chatting.</div>
          )}
        </Card>
      </div>
    </Page>
  );
}
