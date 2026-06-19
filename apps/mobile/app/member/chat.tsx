import { router } from "expo-router";
import { RotateCcw, Send } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, TouchableOpacity, View } from "react-native";

import {
  getMyThread,
  getChatContacts,
  sendChatMessage,
  markThreadRead,
  type ChatMessage,
  type ChatContact,
} from "../../src/api/comms.api";
import { useSocket } from "../../src/hooks/useSocket";
import { useAuthStore } from "../../src/stores/auth.store";
import { getItem, saveItem } from "../../src/utils/storage";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppHeader,
  AppInput,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

type Msg = ChatMessage & { clientId?: string; status?: "sent" | "sending" | "failed" };

const PENDING_KEY = (memberId: string) => `chat_pending_${memberId}`;

export default function ChatScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuthStore();
  const { on, socket } = useSocket();

  const [memberId, setMemberId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the member's chattable staff (trainer + admins), default to the first.
  useEffect(() => {
    void getChatContacts()
      .then((res) => {
        setMemberId(res.memberId);
        setContacts(res.contacts);
        setActiveStaffId((cur) => cur ?? res.contacts[0]?.id ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  // Load the active contact's thread.
  const load = useCallback(async () => {
    if (!activeStaffId) return;
    try {
      const t = await getMyThread(activeStaffId);
      setMemberId(t.memberId);
      setTrainerId(activeStaffId);
      const pendingRaw = t.memberId ? await getItem(PENDING_KEY(t.memberId)) : null;
      const pending: Msg[] = pendingRaw ? JSON.parse(pendingRaw) : [];
      setMessages([...(t.messages as Msg[]), ...pending.map((p) => ({ ...p, status: "failed" as const }))]);
      if (t.memberId) await markThreadRead(t.memberId).catch(() => undefined);
      setContacts((cs) => cs.map((x) => (x.id === activeStaffId ? { ...x, unread: 0 } : x)));
    } catch {
      /* offline — keep whatever is on screen */
    }
  }, [activeStaffId]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const off = on("chat.message", (msg: unknown) => {
      const m = msg as ChatMessage;
      if (!memberId || m.memberId === memberId) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    });
    return off as unknown as () => void;
  }, [on, memberId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  // ── Phase L — presence + typing ───────────────────────────────────────────
  useEffect(() => {
    if (!socket || contacts.length === 0) return;
    socket.emit("presence:get", contacts.map((c) => c.id), (map: Record<string, string>) => setStatuses((s) => ({ ...s, ...map })));
  }, [socket, contacts]);

  useEffect(() => {
    const off = on("presence:update", (p: unknown) => {
      const u = p as { userId: string; status: string };
      setStatuses((s) => ({ ...s, [u.userId]: u.status }));
    });
    return off as unknown as () => void;
  }, [on]);

  useEffect(() => {
    setTypingFrom(null);
    const off = on("chat.typing", (p: unknown) => {
      const t = p as { fromUserId: string; isTyping: boolean };
      if (t.fromUserId !== activeStaffId) return;
      setTypingFrom(t.isTyping ? t.fromUserId : null);
      if (t.isTyping) {
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        typingClearRef.current = setTimeout(() => setTypingFrom(null), 4000);
      }
    });
    return off as unknown as () => void;
  }, [on, activeStaffId]);

  // Away when the app backgrounds.
  useEffect(() => {
    if (!socket) return;
    const sub = AppState.addEventListener("change", (st) => socket.emit("presence:set", st === "active" ? "online" : "away"));
    return () => sub.remove();
  }, [socket]);

  function onDraft(v: string) {
    setDraft(v);
    if (!socket || !activeStaffId || !memberId) return;
    socket.emit("chat:typing", { toUserId: activeStaffId, memberId, isTyping: true });
    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => socket.emit("chat:typing", { toUserId: activeStaffId, memberId, isTyping: false }), 1500);
  }

  async function persistPending(next: Msg[]) {
    if (!memberId) return;
    const failed = next.filter((m) => m.status === "failed").map(({ clientId, message }) => ({ clientId, message, memberId, status: "failed" }));
    await saveItem(PENDING_KEY(memberId), JSON.stringify(failed)).catch(() => undefined);
  }

  async function deliver(text: string, clientId: string) {
    if (!memberId) return;
    try {
      const sent = await sendChatMessage(memberId, text, activeStaffId ?? undefined);
      setMessages((prev) => {
        const next = prev.map((m) => (m.clientId === clientId ? { ...sent, clientId, status: "sent" as const } : m));
        void persistPending(next);
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = prev.map((m) => (m.clientId === clientId ? { ...m, status: "failed" as const } : m));
        void persistPending(next);
        return next;
      });
    }
  }

  function send() {
    if (!draft.trim() || !memberId) return;
    const text = draft.trim();
    const clientId = `c_${Date.now()}`;
    setDraft("");
    const optimistic: Msg = {
      id: clientId, clientId, memberId, trainerId: trainerId ?? "", senderId: user?.id ?? "",
      type: "TEXT", message: text, createdAt: new Date().toISOString(), status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    void deliver(text, clientId);
  }

  function retry(m: Msg) {
    if (!m.clientId) return;
    setMessages((prev) => prev.map((x) => (x.clientId === m.clientId ? { ...x, status: "sending" } : x)));
    void deliver(m.message, m.clientId);
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Chat" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const activeContact = contacts.find((x) => x.id === activeStaffId) ?? null;

  return (
    <AppScreen scroll={false}>
      <AppHeader
        title={activeContact ? activeContact.name : "Chat"}
        subtitle={
          !activeContact
            ? "No contacts yet"
            : typingFrom === activeContact.id
              ? "typing…"
              : statuses[activeContact.id] === "online"
                ? "Online"
                : statuses[activeContact.id] === "away"
                  ? "Away"
                  : activeContact.role === "TRAINER" ? "Your trainer" : "Gym team"
        }
        onBack={() => router.back()}
      />

      {/* Contact picker — trainer + gym admins */}
      {contacts.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
          {contacts.map((ct) => {
            const active = ct.id === activeStaffId;
            return (
              <TouchableOpacity
                key={ct.id}
                onPress={() => setActiveStaffId(ct.id)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill,
                  backgroundColor: active ? c.primary : c.surface, borderWidth: 1,
                  borderColor: active ? c.primary : c.border, flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: statuses[ct.id] === "online" ? c.success : statuses[ct.id] === "away" ? "#f5b301" : c.textMuted }} />
                <AppText variant="label" style={{ color: active ? c.onPrimary : c.textSecondary }}>{ct.name}</AppText>
                {ct.unread > 0 ? (
                  <View style={{ minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: active ? c.onPrimary : c.primary, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 9, fontWeight: "900", color: active ? c.primary : c.onPrimary }}>{ct.unread}</AppText>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {messages.length === 0 ? (
          <AppText variant="body" color="textSecondary" style={{ textAlign: "center", marginTop: 40 }}>
            No messages yet. Say hello 👋
          </AppText>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <View key={m.clientId ?? m.id} style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                <View
                  style={{
                    maxWidth: "78%",
                    backgroundColor: mine ? c.primary : c.surfaceElevated,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <AppText style={{ color: mine ? c.onPrimary : c.textPrimary }}>{m.message}</AppText>
                </View>
                {m.status === "sending" && <AppText variant="caption" color="textMuted">Sending…</AppText>}
                {m.status === "failed" && (
                  <TouchableOpacity onPress={() => retry(m)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <RotateCcw color={c.danger} size={12} />
                    <AppText variant="caption" style={{ color: c.danger }}>Failed — tap to retry</AppText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: 8, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <AppInput placeholder="Type a message…" value={draft} onChangeText={onDraft} editable={!!memberId} />
        </View>
        <TouchableOpacity
          onPress={send}
          disabled={!memberId}
          style={{ height: 48, width: 48, borderRadius: 24, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: memberId ? 1 : 0.5 }}
        >
          <Send color={c.onPrimary} size={20} />
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}
