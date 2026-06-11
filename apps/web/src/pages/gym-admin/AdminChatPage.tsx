import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Search } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import Input from "@/components/forms/Input";
import { EmptyMomentumState } from "@/components/premium";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { chatService, type ChatMessage, type ChatThread } from "@/services/comms.service";
import { memberService } from "@/services/member.service";
import { userService, type GymUser } from "@/services/user.service";

type Tab = "members" | "trainers";
interface Contact { id: string; name: string; subtitle?: string; unread?: number }

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "G";
}

/** Gym Admin chat console — converse with members and trainers in real time. */
export default function AdminChatPage() {
  const { user } = useAuthStore();
  const { on } = useSocket();

  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<Contact[]>([]);
  const [trainers, setTrainers] = useState<Contact[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [search, setSearch] = useState("");

  const [active, setActive] = useState<{ kind: Tab; id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadContacts() {
    const [mRes, tRes, thRes] = await Promise.all([
      memberService.list().catch(() => ({ data: { members: [] } })),
      userService.listByRoles(["TRAINER"]).catch(() => [] as GymUser[]),
      chatService.threads().catch(() => [] as ChatThread[]),
    ]);
    setThreads(thRes);
    setMembers((mRes.data.members ?? []).map((m) => ({ id: m.id, name: m.user?.name ?? "Member", subtitle: m.user?.email })));
    setTrainers(tRes.map((t) => ({ id: t.id, name: t.name, subtitle: t.email })));
  }
  useEffect(() => { void loadContacts(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime: append messages for the open conversation; refresh unread.
  useEffect(() => {
    const off = on<ChatMessage & { staff?: boolean }>("chat.message", (msg) => {
      if (!active) { void loadContacts(); return; }
      const matchMember = active.kind === "members" && msg.memberId === active.id;
      const matchTrainer = active.kind === "trainers" && !msg.memberId && msg.trainerId === active.id;
      if (matchMember || matchTrainer) {
        setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      }
      void loadContacts();
    });
    return off;
  }, [on, active]);

  async function openMember(c: Contact) {
    setActive({ kind: "members", id: c.id, name: c.name });
    setMessages(await chatService.memberMessages(c.id).catch(() => []));
    await chatService.markRead(c.id).catch(() => undefined);
    void loadContacts();
  }
  async function openTrainer(c: Contact) {
    setActive({ kind: "trainers", id: c.id, name: c.name });
    const t = await chatService.staffThread(c.id).catch(() => ({ messages: [] as ChatMessage[] }));
    setMessages(t.messages ?? []);
  }

  async function send() {
    if (!draft.trim() || !active) return;
    const text = draft.trim();
    setDraft("");
    const sent = active.kind === "members"
      ? await chatService.send({ memberId: active.id, message: text }).catch(() => null)
      : await chatService.sendStaff({ trainerId: active.id, message: text }).catch(() => null);
    if (sent) setMessages((m) => (m.some((x) => x.id === sent.id) ? m : [...m, sent]));
    void loadContacts();
  }

  const contacts = tab === "members" ? members : trainers;
  const unreadFor = (id: string) => threads.find((t) => t.memberId === id)?.unread ?? 0;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.subtitle ?? "").toLowerCase().includes(q));
  }, [contacts, search]);

  const totalUnread = threads.reduce((s, t) => s + (t.unread ?? 0), 0);

  return (
    <Page
      title="Chat"
      eyebrow="Relationship Hub"
      description="Real-time conversations with members and trainers — keep every relationship warm."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* ── Contacts ─────────────────────────────────────────────────────── */}
        <div className="surface-card flex flex-col overflow-hidden p-0">
          <div className="flex gap-1 border-b border-border p-2">
            {(["members", "trainers"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setActive(null); setMessages([]); }}
                className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${tab === t ? "bg-(image:--gradient-primary) text-white shadow-[0_6px_16px_rgba(231,55,37,0.28)]" : "text-(--text-secondary) hover:bg-(--surface-hover)"}`}
              >
                {t === "members" ? "Members" : "Trainers"}
                {t === "members" && totalUnread > 0 && tab !== "members" && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-1.5 text-[10px] font-black text-white">{totalUnread}</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
              <input
                className="h-10 w-full rounded-xl border border-border bg-(--surface-solid) pl-9 pr-3 text-sm text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[58vh] overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-(--text-muted)">No {tab} found.</p>
            ) : filtered.map((c) => {
              const unread = tab === "members" ? unreadFor(c.id) : 0;
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => (tab === "members" ? openMember(c) : openTrainer(c))}
                  className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-(--surface-hover) ${isActive ? "bg-(--surface-hover)" : ""}`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-(image:--gradient-primary)" aria-hidden="true" />}
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${unread > 0 ? "bg-(image:--gradient-primary) text-white" : "bg-primary/10 text-primary ring-1 ring-primary/20"}`}>
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm ${unread > 0 ? "font-black text-(--text-primary)" : "font-bold text-(--text-primary)"}`}>{c.name}</div>
                    <div className="truncate text-xs text-(--text-muted)">{c.subtitle}</div>
                  </div>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white">{unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Conversation ─────────────────────────────────────────────────── */}
        <div className="surface-card flex h-[64vh] flex-col p-0">
          {!active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyMomentumState
                icon={<MessageSquare />}
                title="Every great relationship starts with a message"
                description="Pick a member or trainer to open the conversation. A quick check-in is how loyalty is built."
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(image:--gradient-primary) text-xs font-black text-white">
                  {initials(active.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-black tracking-tight text-(--text-primary)">{active.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                    <span className="pulse-dot" aria-hidden="true" />
                    {active.kind === "trainers" ? "Trainer" : "Member"} · live
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin p-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-(--text-muted)">No messages yet. Say hello 👋</p>
                ) : messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[72%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${mine ? "rounded-2xl rounded-br-md bg-(image:--gradient-primary) text-white" : "rounded-2xl rounded-bl-md border border-border bg-(--surface-secondary) text-(--text-primary)"}`}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="flex gap-2 border-t border-border p-3">
                <Input className="flex-1" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button iconLeft={<Send className="h-4 w-4" />} onClick={send}>Send</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
