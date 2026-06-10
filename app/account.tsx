import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors, spacing, EVENT_TYPES, LANGUAGES, eventTypeLabel, formatDate } from "@/src/theme";
import { useAuth } from "@/src/auth";
import {
  addSavedFilter,
  deleteSavedFilter,
  listEvents,
  type Event,
  type SavedFilter,
} from "@/src/api";

type Tab = "profile" | "preferences" | "filters" | "events";

export default function AccountScreen() {
  const router = useRouter();
  const { user, ready, signOut, updateProfile, token, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  React.useEffect(() => {
    if (ready && !user) router.replace("/auth/login");
  }, [ready, user, router]);

  useFocusEffect(
    React.useCallback(() => {
      refresh().catch(() => {});
    }, [refresh])
  );

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }
  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="account-screen">
      <View style={styles.header}>
        <Pressable testID="acc-back" style={styles.backBtn} onPress={() => router.replace("/")}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>MŮJ PROFIL</Text>
          <Text style={styles.brandSub}>{user.email}</Text>
        </View>
        <Pressable testID="acc-logout-btn" style={styles.logoutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(
          [
            { id: "profile", label: "PROFIL" },
            { id: "preferences", label: "FILTRY" },
            { id: "filters", label: "ULOŽENÉ" },
            { id: "events", label: "MOJE AKCE" },
          ] as { id: Tab; label: string }[]
        ).map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              testID={`acc-tab-${t.id}`}
              style={[styles.tabBtn, active ? styles.tabActive : styles.tabInactive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {tab === "profile" && <ProfileTab />}
        {tab === "preferences" && <PreferencesTab />}
        {tab === "filters" && <FiltersTab />}
        {tab === "events" && <EventsTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [first, setFirst] = useState(user?.first_name ?? "");
  const [last, setLast] = useState(user?.last_name ?? "");
  const [marketing, setMarketing] = useState(user?.gdpr_marketing ?? false);
  const [summary, setSummary] = useState(user?.gdpr_post_event_summary ?? false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile({
        first_name: first,
        last_name: last,
        gdpr_marketing: marketing,
        gdpr_post_event_summary: summary,
      });
      setMsg("Uloženo ✓");
    } catch (e: any) {
      setMsg(e?.message ?? "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.avatarRow}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={styles.avatarInitials}>
              {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.bigName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.muted}>{user?.email}</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>JMÉNO</Text>
      <TextInput testID="acc-first" style={styles.input} value={first} onChangeText={setFirst} />
      <Text style={styles.fieldLabel}>PŘÍJMENÍ</Text>
      <TextInput testID="acc-last" style={styles.input} value={last} onChangeText={setLast} />

      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>GDPR SOUHLAS</Text>
      <Pressable testID="acc-gdpr-marketing" style={styles.checkRow} onPress={() => setMarketing(!marketing)}>
        <Ionicons
          name={marketing ? "checkbox" : "square-outline"}
          size={20}
          color={marketing ? colors.brand : colors.onSurface}
        />
        <Text style={styles.checkText}>
          Komerční sdělení (newsletter, doporučení akcí)
        </Text>
      </Pressable>
      <Pressable testID="acc-gdpr-summary" style={styles.checkRow} onPress={() => setSummary(!summary)}>
        <Ionicons
          name={summary ? "checkbox" : "square-outline"}
          size={20}
          color={summary ? colors.brand : colors.onSurface}
        />
        <Text style={styles.checkText}>
          Shrnutí po akci (fotky, materiály, hodnocení)
        </Text>
      </Pressable>

      {msg && (
        <View style={styles.msgBlock}>
          <Text style={styles.msgText}>{msg}</Text>
        </View>
      )}

      <Pressable testID="acc-save" style={styles.primaryBtn} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? "UKLÁDÁM…" : "ULOŽIT ZMĚNY →"}</Text>
      </Pressable>
    </View>
  );
}

function PreferencesTab() {
  const { user, updateProfile } = useAuth();
  const prefs = user?.preferences ?? {};
  const [types, setTypes] = useState<string[]>(prefs.event_types ?? []);
  const [langs, setLangs] = useState<string[]>(prefs.languages ?? []);
  const [kids, setKids] = useState<boolean>(!!prefs.for_children);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = <T extends string>(arr: T[], v: T, setter: (a: T[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile({
        preferences: { event_types: types, languages: langs, for_children: kids },
      });
      setMsg("Preference uloženy ✓");
    } catch (e: any) {
      setMsg(e?.message ?? "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.hint}>
        Nastav, jaké akce tě zajímají. Použijeme je jako výchozí filtr a pro
        budoucí doporučení.
      </Text>

      <Text style={styles.fieldLabel}>OBLÍBENÉ TYPY AKCÍ</Text>
      <View style={styles.chipWrap}>
        {EVENT_TYPES.filter((t) => t.id !== "all").map((t) => {
          const active = types.includes(t.id);
          return (
            <Pressable
              key={t.id}
              testID={`pref-type-${t.id}`}
              style={[styles.smallChip, active ? styles.smallChipActive : styles.smallChipInactive]}
              onPress={() => toggle(types, t.id, setTypes)}
            >
              <Text style={[styles.smallChipText, active ? styles.smallChipTextActive : styles.smallChipTextInactive]}>
                {t.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>JAZYK AKCÍ</Text>
      <View style={styles.chipWrap}>
        {LANGUAGES.map((l) => {
          const active = langs.includes(l.id);
          return (
            <Pressable
              key={l.id}
              testID={`pref-lang-${l.id}`}
              style={[styles.smallChip, active ? styles.smallChipActive : styles.smallChipInactive]}
              onPress={() => toggle(langs, l.id, setLangs)}
            >
              <Text style={[styles.smallChipText, active ? styles.smallChipTextActive : styles.smallChipTextInactive]}>
                {l.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable testID="pref-kids" style={styles.checkRow} onPress={() => setKids(!kids)}>
        <Ionicons name={kids ? "checkbox" : "square-outline"} size={20} color={kids ? colors.brand : colors.onSurface} />
        <Text style={styles.checkText}>Zajímají mě akce pro děti</Text>
      </Pressable>

      {msg && (
        <View style={styles.msgBlock}>
          <Text style={styles.msgText}>{msg}</Text>
        </View>
      )}

      <Pressable testID="pref-save" style={styles.primaryBtn} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? "UKLÁDÁM…" : "ULOŽIT PREFERENCE →"}</Text>
      </Pressable>
    </View>
  );
}

function FiltersTab() {
  const { user, token, refresh } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const saveCurrentAsFilter = async () => {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      const prefs = user?.preferences ?? {};
      await addSavedFilter(token, {
        name: name.trim(),
        event_types: prefs.event_types ?? [],
        organizer_ids: [],
        languages: prefs.languages ?? [],
        publishers: [],
        for_children: prefs.for_children ?? null,
      });
      setName("");
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    await deleteSavedFilter(token, id);
    await refresh();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.hint}>
        Ulož si svoje oblíbené filtry pro rychlý přístup. Jakmile zavedeme
        notifikace, budeš dostávat upozornění na akce odpovídající tvým filtrům.
      </Text>

      <Text style={styles.fieldLabel}>NOVÝ ULOŽENÝ FILTR</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <TextInput
          testID="filter-name"
          style={[styles.input, { flex: 1 }]}
          value={name}
          onChangeText={setName}
          placeholder="Např. „Autorská čtení česky"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          testID="filter-save"
          style={[styles.saveSmallBtn, { opacity: name.trim() ? 1 : 0.4 }]}
          onPress={saveCurrentAsFilter}
          disabled={!name.trim() || saving}
        >
          <Ionicons name="add" size={20} color={colors.onBrand} />
        </Pressable>
      </View>
      <Text style={styles.hintSmall}>
        Filtr se uloží podle tvých aktuálních preferencí (záložka FILTRY).
      </Text>

      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
        ULOŽENÉ FILTRY · {user?.saved_filters?.length ?? 0}
      </Text>
      {(user?.saved_filters ?? []).length === 0 ? (
        <Text style={styles.emptyText}>Zatím žádné uložené filtry.</Text>
      ) : (
        user!.saved_filters.map((f: SavedFilter) => (
          <View key={f.id} style={styles.filterRow} testID={`saved-filter-${f.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterName}>{f.name}</Text>
              <Text style={styles.filterMeta} numberOfLines={2}>
                {[
                  f.event_types?.map((t) => eventTypeLabel(t)).join(", "),
                  f.languages?.length ? `jazyk: ${f.languages.join(", ")}` : "",
                  f.for_children ? "pro děti" : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Žádné podmínky"}
              </Text>
            </View>
            <Pressable
              testID={`del-filter-${f.id}`}
              style={styles.delBtn}
              onPress={() => remove(f.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.onBrand} />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

function EventsTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [favs, setFavs] = useState<Event[]>([]);
  const [att, setAtt] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await listEvents();
        const f = (user?.favorites ?? [])
          .map((id) => all.find((e) => e.id === id))
          .filter((e): e is Event => !!e);
        const a = (user?.attending ?? [])
          .map((id) => all.find((e) => e.id === id))
          .filter((e): e is Event => !!e);
        setFavs(f);
        setAtt(a);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.favorites, user?.attending]);

  if (loading) return <View style={styles.section}><ActivityIndicator color={colors.brand} /></View>;

  const today = new Date().toISOString().slice(0, 10);
  const past = att.filter((e) => e.date < today);
  const upcoming = att.filter((e) => e.date >= today);

  const Row = ({ e }: { e: Event }) => (
    <Pressable
      testID={`acc-event-${e.id}`}
      style={styles.eventRow}
      onPress={() => router.push(`/event/${e.id}`)}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.eventType}>{eventTypeLabel(e.event_type).toUpperCase()}</Text>
        <Text style={styles.eventTitle} numberOfLines={2}>{e.title}</Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {formatDate(e.date)} · {e.time} · {e.venue}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.onSurface} />
    </Pressable>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>OBLÍBENÉ · {favs.length}</Text>
      {favs.length === 0 ? (
        <Text style={styles.emptyText}>Žádné oblíbené akce.</Text>
      ) : (
        favs.map((e) => <Row key={e.id} e={e} />)
      )}

      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>NADCHÁZEJÍCÍ ÚČAST · {upcoming.length}</Text>
      {upcoming.length === 0 ? (
        <Text style={styles.emptyText}>Zatím se na žádnou akci nehlásíš.</Text>
      ) : (
        upcoming.map((e) => <Row key={e.id} e={e} />)
      )}

      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>MOJE ÚČAST (MINULÉ) · {past.length}</Text>
      <Text style={styles.hintSmall}>U minulých akcí můžeš nechat hodnocení.</Text>
      {past.length === 0 ? (
        <Text style={styles.emptyText}>Zatím žádné minulé akce.</Text>
      ) : (
        past.map((e) => <Row key={e.id} e={e} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 18, fontWeight: "900", letterSpacing: -0.3, color: colors.onSurface },
  brandSub: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: colors.brand, fontFamily: "Courier", marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: colors.borderStrong },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { backgroundColor: colors.surfaceInverse },
  tabInactive: { backgroundColor: colors.surface },
  tabText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  tabTextActive: { color: colors.onSurfaceInverse },
  tabTextInactive: { color: colors.muted },

  section: { padding: spacing.lg, gap: spacing.md },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.brand,
    overflow: "hidden",
  },
  avatarInitials: { color: colors.onBrand, fontSize: 24, fontWeight: "900" },
  bigName: { fontSize: 18, fontWeight: "900", color: colors.onSurface },
  muted: { color: colors.muted, fontSize: 12 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: "Courier",
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.onSurface,
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  checkText: { flex: 1, fontSize: 13, color: colors.onSurface, lineHeight: 18 },
  msgBlock: { backgroundColor: colors.surfaceTertiary, padding: spacing.md, marginTop: spacing.sm },
  msgText: { color: colors.brand, fontWeight: "800" },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5 },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  hintSmall: { fontSize: 11, color: colors.muted },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  smallChipActive: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  smallChipInactive: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  smallChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  smallChipTextActive: { color: colors.onSurfaceInverse },
  smallChipTextInactive: { color: colors.onSurface },
  saveSmallBtn: {
    width: 50,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: spacing.sm,
  },
  filterName: { fontSize: 14, fontWeight: "900", color: colors.onSurface },
  filterMeta: { fontSize: 11, color: colors.onSurfaceSecondary, marginTop: 2 },
  delBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: colors.muted, fontSize: 13, marginTop: spacing.sm },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: spacing.sm,
  },
  eventType: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: colors.brand, fontFamily: "Courier" },
  eventTitle: { fontSize: 14, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.3 },
  eventMeta: { fontSize: 11, color: colors.onSurfaceSecondary },
});
