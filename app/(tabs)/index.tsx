import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, spacing, eventTypeLabel, shortDate } from "@/src/theme";
import { listEvents, type Event } from "@/src/api";
import EventCard from "@/src/components/EventCard";
import FilterSheet, {
  type Filters,
  toEventFilters,
  activeFilterCount,
} from "@/src/components/FilterSheet";
import { useAuth } from "@/src/auth";
import { useGeolocation } from "@/src/hooks/use-geolocation";

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const geo = useGeolocation();

  const [events, setEvents] = useState<Event[]>([]);
  const [nearby, setNearby] = useState<Event[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const base = toEventFilters(filters, geo.coords);
    if (q.trim()) base.q = q.trim();
    const data = await listEvents(base);
    setEvents(data);
    // Nearby today section: today's events within 5km (only when location ready)
    if (geo.coords) {
      const near = await listEvents({
        date_from: todayIso,
        date_to: todayIso,
        lat: geo.coords.lat,
        lng: geo.coords.lng,
        radius_km: 5,
      });
      setNearby(near);
    } else {
      setNearby([]);
    }
  }, [filters, q, geo.coords, todayIso]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const fCount = useMemo(() => activeFilterCount(filters), [filters]);
  const hero = events[0];
  const rest = events.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="feed-screen">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onLongPress={() => router.push("/admin")}
            delayLongPress={800}
            testID="feed-brand-mark"
          >
            <Text style={styles.brandMark}>PRAGUE</Text>
          </Pressable>
          <Text style={styles.brandSub}>LIT · CULTURE</Text>
          <View style={{ flex: 1 }} />
          <Pressable
            testID="feed-profile-btn"
            style={styles.profileBtn}
            onPress={() => router.push("/account")}
          >
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.profileImage} />
            ) : (
              <Ionicons
                name={user ? "person" : "person-outline"}
                size={18}
                color={colors.onSurface}
              />
            )}
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.onSurface} />
            <TextInput
              testID="feed-search-input"
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                load();
              }}
              placeholder="Hledat akce, autora..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {q.length > 0 && (
              <Pressable testID="feed-search-clear" onPress={() => setQ("")}>
                <Ionicons name="close" size={18} color={colors.onSurface} />
              </Pressable>
            )}
          </View>
          <Pressable
            testID="feed-filter-btn"
            style={[styles.filterBtn, fCount > 0 && styles.filterBtnActive]}
            onPress={() => setFiltersOpen(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={fCount > 0 ? colors.onBrand : colors.onSurface}
            />
            {fCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{fCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center} testID="feed-loading">
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.mono}>NAČÍTÁNÍ...</Text>
        </View>
      ) : (
        <FlatList
          testID="feed-list"
          data={rest}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <EventCard event={item} />}
          ListHeaderComponent={
            <>
              <NearbyTodaySection geo={geo} events={nearby} todayIso={todayIso} />
              {hero ? <EventCard event={hero} variant="hero" /> : (
                <View style={styles.emptyAll} testID="feed-empty">
                  <Text style={styles.emptyTitle}>ŽÁDNÉ AKCE</Text>
                  <Text style={styles.emptyText}>
                    Pro tyto filtry nejsou žádné akce. Zkus je upravit.
                  </Text>
                </View>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        />
      )}

      <FilterSheet
        visible={filtersOpen}
        initial={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={setFilters}
        hasLocation={!!geo.coords}
      />
    </SafeAreaView>
  );
}

function NearbyTodaySection({
  geo,
  events,
  todayIso,
}: {
  geo: ReturnType<typeof useGeolocation>;
  events: Event[];
  todayIso: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.nearWrap} testID="nearby-today">
      <View style={styles.nearHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nearTitle}>DNES VE TVÉM OKOLÍ</Text>
          <Text style={styles.nearSub}>{todayIso}</Text>
        </View>
        {geo.status !== "granted" && (
          <Pressable
            testID="nearby-enable-loc"
            style={styles.nearEnable}
            onPress={geo.request}
          >
            <Ionicons name="location-outline" size={16} color={colors.onBrand} />
            <Text style={styles.nearEnableText}>POVOLIT POLOHU</Text>
          </Pressable>
        )}
      </View>

      {geo.status === "loading" ? (
        <View style={styles.nearLoading}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : geo.status === "denied" || geo.status === "unavailable" ? (
        <View style={styles.nearMsg}>
          <Text style={styles.nearMsgText}>
            Bez povolené polohy nemůžeme zobrazit akce v okolí. Můžeš to změnit v
            nastavení zařízení.
          </Text>
        </View>
      ) : geo.status === "idle" ? (
        <View style={styles.nearMsg}>
          <Text style={styles.nearMsgText}>
            Povol polohu a uvidíš akce dnes do 5 km od tebe.
          </Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.nearMsg}>
          <Text style={styles.nearMsgText}>
            Dnes ve tvém okolí (5 km) nejsou žádné akce.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearList}
        >
          {events.map((e) => {
            const { day, month } = shortDate(e.date);
            return (
              <Pressable
                key={e.id}
                testID={`nearby-card-${e.id}`}
                style={styles.nearCard}
                onPress={() => router.push(`/event/${e.id}`)}
              >
                <Image source={{ uri: e.image_url }} style={styles.nearImg} contentFit="cover" />
                <View style={styles.nearOverlay}>
                  <View style={styles.nearDateBlock}>
                    <Text style={styles.nearDay}>{day}</Text>
                    <Text style={styles.nearMonth}>{month}</Text>
                  </View>
                </View>
                <View style={styles.nearBody}>
                  <Text style={styles.nearType}>{eventTypeLabel(e.event_type).toUpperCase()}</Text>
                  <Text style={styles.nearCardTitle} numberOfLines={2}>{e.title}</Text>
                  <Text style={styles.nearVenue} numberOfLines={1}>
                    {e.time} · {e.venue}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
    gap: spacing.md,
  },
  headerTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandMark: { fontSize: 18, fontWeight: "900", letterSpacing: 2, color: colors.onSurface },
  brandSub: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%" },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface, paddingVertical: 4 },
  filterBtn: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeText: { color: colors.onSurfaceInverse, fontSize: 10, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  mono: { fontFamily: "Courier", fontSize: 12, letterSpacing: 1.5, color: colors.muted, fontWeight: "700" },
  emptyAll: { padding: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: colors.onSurface, letterSpacing: -0.5 },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center" },

  // Nearby section
  nearWrap: {
    backgroundColor: colors.surfaceInverse,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
  },
  nearHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  nearTitle: {
    color: colors.onSurfaceInverse,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  nearSub: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: "Courier",
    marginTop: 2,
  },
  nearEnable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nearEnableText: { color: colors.onBrand, fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  nearLoading: { padding: spacing.lg, alignItems: "center" },
  nearMsg: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  nearMsgText: { color: colors.onSurfaceInverse, opacity: 0.8, fontSize: 12 },
  nearList: { paddingHorizontal: spacing.lg, gap: spacing.md, alignItems: "stretch" },
  nearCard: {
    width: 220,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  nearImg: { width: "100%", height: 120 },
  nearOverlay: { position: "absolute", top: 0, left: 0, padding: spacing.sm },
  nearDateBlock: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  nearDay: { fontSize: 20, fontWeight: "900", color: colors.onSurface, letterSpacing: -1 },
  nearMonth: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1,
    fontFamily: "Courier",
  },
  nearBody: { padding: spacing.md, gap: 4 },
  nearType: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2, color: colors.muted },
  nearCardTitle: { fontSize: 14, fontWeight: "900", color: colors.onSurface, letterSpacing: -0.3, lineHeight: 18 },
  nearVenue: { fontSize: 11, color: colors.onSurfaceSecondary },
});
