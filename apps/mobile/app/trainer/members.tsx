import { router } from "expo-router";
import { ChevronRight, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trainerApi } from "../../src/api/trainer.api";
import type { AssignedMember } from "../../src/types/trainer.types";
import { useTheme, type Theme } from "../../src/theme";
import { AppAvatar, AppCard, AppEmptyState, AppText } from "../../src/components/ui";

export default function TrainerMembersScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
            m.fitnessGoal?.toLowerCase().includes(q),
        ),
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
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.headerArea}>
        <AppText variant="title">My Members</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 4, marginBottom: 16 }}>
          {members.length} member{members.length !== 1 ? "s" : ""} assigned
        </AppText>

        <View style={styles.searchBar}>
          <Search color={c.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or goal..."
            placeholderTextColor={c.textMuted}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
          />
        }
        ListEmptyComponent={
          <AppEmptyState
            emoji="👥"
            title="No members found"
            description={query ? "Try a different search term." : "No members assigned to you yet."}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: "/trainer/member-detail", params: { memberId: item.id } })
            }
          >
            <MemberListCard member={item} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function MemberListCard({ member }: { member: AssignedMember }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const name = member.user?.name ?? "Member";
  const email = member.user?.email ?? "";
  const goal = member.fitnessGoal ?? "General Fitness";

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <AppAvatar name={name} size={48} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{name}</AppText>
          {email ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
              {email}
            </AppText>
          ) : null}
          <AppText variant="caption" color="primary" numberOfLines={1} style={{ marginTop: 2 }}>
            {goal}
          </AppText>
        </View>
        <View
          style={{
            height: 34,
            width: 34,
            borderRadius: theme.radius.sm,
            backgroundColor: c.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight color={c.textMuted} size={18} />
        </View>
      </View>
    </AppCard>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    headerArea: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      height: 50,
      gap: 10,
    },
    searchInput: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: "600" },
    list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  });
}
