import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Check, CheckCheck, Dumbbell, Shield } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { chatService, type ChatMessage, type ChatContact } from "@/services/comms.service";

/** Member chat — pick a trainer or admin and message them in real time. */
export default function MemberChatPage() {
  const { user } = useAuthStore();
  const { on, socket } = useSocket();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadContacts() {
    const res = await chatService.contacts().catch(() => null);
    if (res) {
      setMemberId(res.memberId);
      setContacts(res.contacts);
      setActiveId((cur) => cur ?? res.contacts[0]?.id ?? null);
    }
    setLoading(false);
  }
  useEffect(() => { void loadContacts(); }, []);

  // Load the selected contact's thread.
  useEffect(() => {
    if (!activeId) return;
    void chatService.myThread(activeId).then((t) => setMessages(t.messages)).catch(() => setMessages([]));
    setContacts((cs) => cs.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)));
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime: append messages for the active conversation; bump unread otherwise.
  useEffect(() => {
    const off = on<ChatMessage>("chat.message", (msg) => {
      if (memberId && msg.memberId !== memberId) return;
      if (msg.trainerId === activeId) {
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      } else if (msg.senderId !== user?.id) {
        setContacts((cs) => cs.map((c) => (c.id === msg.trainerId ? { ...c, unread: c.unread + 1, lastMessage: msg.message } : c)));
      }
    });
    return off;
  }, [on, memberId, activeId, user?.id]);

  // Realtime read receipts: when staff reads, mark my sent messages read.
  useEffect(() => {
    const off = on<{ memberId: string; readerId: string }>("chat.read", (p) => {
      if (memberId && p.memberId === memberId) {
        setMessages((m) => m.map((x) => (x.senderId === user?.id ? { ...x, isRead: true } : x)));
      }
    });
    return off;
  }, [on, memberId, user?.id]);

  // Presence: request statuses for contacts, then live-update. (Phase L)
  useEffect(() => {
    if (!socket || contacts.length === 0) return;
    socket.emit("presence:get", contacts.map((c) => c.id), (map: Record<string, string>) => setStatuses((s) => ({ ...s, ...map })));
  }, [socket, contacts]);

  useEffect(() => {
    const off = on<{ userId: string; status: string }>("presence:update", (p) => setStatuses((s) => ({ ...s, [p.userId]: p.status })));
    return off;
  }, [on]);

  // Tell the server we're away when the tab is hidden.
  useEffect(() => {
    if (!socket) return;
    const handler = () => socket.emit("presence:set", document.hidden ? "away" : "online");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [socket]);

  // Typing indicator from the active contact (auto-clears).
  useEffect(() => {
    setTypingFrom(null);
    const off = on<{ fromUserId: string; isTyping: boolean }>("chat.typing", (p) => {
      if (p.fromUserId !== activeId) return;
      setTypingFrom(p.isTyping ? p.fromUserId : null);
      if (p.isTyping) {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => setTypingFrom(null), 4000);
      }
    });
    return off;
  }, [on, activeId]);

  function onDraft(v: string) {
    setDraft(v);
    if (!socket || !activeId || !memberId) return;
    socket.emit("chat:typing", { toUserId: activeId, memberId, isTyping: true });
    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => socket.emit("chat:typing", { toUserId: activeId, memberId, isTyping: false }), 1500);
  }

  async function send() {
    if (!draft.trim() || !memberId || !activeId) return;
    const text = draft.trim();
    setDraft("");
    if (socket && activeId) socket.emit("chat:typing", { toUserId: activeId, memberId, isTyping: false });
    const sent = await chatService.send({ memberId, message: text, trainerId: activeId }).catch(() => null);
    if (sent) setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    setContacts((cs) => cs.map((c) => (c.id === activeId ? { ...c, lastMessage: text } : c)));
  }

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase())),
    [contacts, search],
  );
  const active = contacts.find((c) => c.id === activeId) ?? null;

  if (loading) return <Page title="Chat"><Skeleton height="h-64" /></Page>;

  const roleLabel = (r: string) => (r === "TRAINER" ? "Trainer" : r === "RECEPTIONIST" ? "Reception" : "Admin");
  const RoleIcon = ({ r }: { r: string }) => (r === "TRAINER" ? <Dumbbell className="h-4 w-4 text-(--flame)" /> : <Shield className="h-4 w-4 text-(--text-secondary)" />);
  const dotColor = (s?: string) => (s === "online" ? "bg-(--success)" : s === "away" ? "bg-amber-400" : "bg-(--text-muted)");
  const StatusDot = ({ id }: { id: string }) => (
    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-(--surface) ${dotColor(statuses[id])}`} />
  );
  const statusLabel = (s?: string) => (s === "online" ? "Online" : s === "away" ? "Away" : "Offline");

  return (
    <Page title="Chat" description="Message your trainer or gym team in real time.">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Contacts */}
        <Card variant="solid" className="flex max-h-[70vh] flex-col p-0">
          <div className="border-b border-border p-3">
            <Input placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-(--text-secondary)">No contacts found.</p>
            ) : filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition ${activeId === c.id ? "bg-(--surface-hover)" : "hover:bg-(--surface-hover)"}`}
              >
                <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--surface-secondary)"><RoleIcon r={c.role} /><StatusDot id={c.id} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-(--text-primary)">{c.name}</p>
                    {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--flame) px-1 text-xs font-bold text-white">{c.unread}</span>}
                  </div>
                  <p className="truncate text-xs text-(--text-muted)">{roleLabel(c.role)}{c.lastMessage ? ` · ${c.lastMessage}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Thread */}
        <Card variant="solid" className="flex h-[70vh] flex-col p-0">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <div className="relative grid h-9 w-9 place-items-center rounded-full bg-(--surface-secondary)"><RoleIcon r={active.role} /><StatusDot id={active.id} /></div>
                <div>
                  <p className="text-sm font-semibold text-(--text-primary)">{active.name}</p>
                  <p className="text-xs text-(--text-muted)">
                    {typingFrom === active.id ? <span className="text-(--flame)">typing…</span> : statusLabel(statuses[active.id])}
                  </p>
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
                        {mine && (
                          <span className="ml-1 inline-flex translate-y-0.5 text-white/70">
                            {m.isRead ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input className="flex-1" placeholder="Type a message…" value={draft} onChange={(e) => onDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button iconLeft={<Send className="h-4 w-4" />} onClick={send}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-(--text-secondary)">Select a person to start chatting.</div>
          )}
        </Card>
      </div>
    </Page>
  );
}
