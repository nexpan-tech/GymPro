import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import AppCard from "../../src/components/AppCard";
import type { AssignedMember } from "../../src/types/trainer.types";

export default function TrainerMembersScreen() {
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [filtered, setFiltered] = useState<AssignedMember[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const data = await trainerApi.getAssignedMembers();
      const list = Array.isArray(data) ? data : [];
      setMembers(list);
      setFiltered(list);
    } catch (error) {
      console.log("Members load failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  function handleSearch(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = text.trim().toLowerCase();
      if (!q) {
        setFiltered(members);
        return;
      }
      setFiltered(
        members.filter(
          (m) =>
            m.user?.name?.toLowerCase().includes(q) ||
            m.user?.email?.toLowerCase().includes(q) ||
            m.fitnessGoal?.toLowerCase().includes(q)
        )
      );
    }, 250);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadMembers();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>My Members</Text>
        <Text style={styles.subtitle}>
          {members.length} member{members.length !== 1 ? "s" : ""} assigned
        </Text>

        <View style={styles.searchBar}>
          <Search color="#64748b" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or goal..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No members found</Text>
            <Text style={styles.emptySubtitle}>
              {query
                ? "Try a different search term."
                : "No members assigned to you yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/trainer/member-detail",
                params: { memberId: item.id },
              })
            }
          >
            <MemberListCard member={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function MemberListCard({ member }: { member: AssignedMember }) {
  const name = member.user?.name ?? "Member";
  const email = member.user?.email ?? "";
  const goal = member.fitnessGoal ?? "General Fitness";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>{name}</Text>
          {email ? (
            <Text style={styles.memberEmail} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
          <Text style={styles.memberGoal} numberOfLines={1}>
            {goal}
          </Text>
        </View>

        <View style={styles.arrowBadge}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: "#312e81",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  initials: {
    color: "#c7d2fe",
    fontSize: 16,
    fontWeight: "900" as const,
  },
  memberName: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900" as const,
  },
  memberEmail: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  memberGoal: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  arrowBadge: {
    height: 34,
    width: 34,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  arrowText: {
    color: "#64748b",
    fontSize: 20,
    fontWeight: "900" as const,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: 60,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
  },
  emptySubtitle: {
    color: "#94a3b8",
    textAlign: "center" as const,
  },
};
