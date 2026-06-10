import { router } from "expo-router";
import { RotateCcw, Send } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import {
  getMyThread,
  sendChatMessage,
  markThreadRead,
  type ChatMessage,
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
  const { on } = useSocket();

  const [memberId, setMemberId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const t = await getMyThread();
      setMemberId(t.memberId);
      setTrainerId(t.trainerId);
      // Re-attach any messages that failed to send while offline (persisted).
      const pendingRaw = t.memberId ? await getItem(PENDING_KEY(t.memberId)) : null;
      const pending: Msg[] = pendingRaw ? JSON.parse(pendingRaw) : [];
      setMessages([...(t.messages as Msg[]), ...pending.map((p) => ({ ...p, status: "failed" as const }))]);
      if (t.memberId) await markThreadRead(t.memberId).catch(() => undefined);
    } catch {
      /* offline — keep whatever is on screen */
    } finally {
      setLoading(false);
    }
  }, []);
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

  async function persistPending(next: Msg[]) {
    if (!memberId) return;
    const failed = next.filter((m) => m.status === "failed").map(({ clientId, message }) => ({ clientId, message, memberId, status: "failed" }));
    await saveItem(PENDING_KEY(memberId), JSON.stringify(failed)).catch(() => undefined);
  }

  async function deliver(text: string, clientId: string) {
    if (!memberId) return;
    try {
      const sent = await sendChatMessage(memberId, text);
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

  return (
    <AppScreen scroll={false}>
      <AppHeader
        title="Chat with Trainer"
        subtitle={trainerId ? "Realtime messaging" : "No assigned trainer yet"}
        onBack={() => router.back()}
      />
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
          <AppInput placeholder="Type a message…" value={draft} onChangeText={setDraft} editable={!!memberId} />
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
