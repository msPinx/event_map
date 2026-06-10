import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, eventTypeLabel, formatDate } from "@/src/theme";
import { listEvents, type Event } from "@/src/api";
import { EventsMap } from "@/src/components/MapViews";
import FilterSheet, {
  type Filters,
  toEventFilters,
  activeFilterCount,
} from "@/src/components/FilterSheet";
import { useGeolocation } from "@/src/hooks/use-geolocation";

export default function MapScreen() {
  const router = useRouter();
  const geo = useGeolocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Event | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEvents(toEventFilters(filters, geo.coords));
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, [filters, geo.coords]);

  useEffect(() => {
    load();
  }, [load]);

  const markers = useMemo(
    () => events.map((e) => ({ id: e.id, latitude: e.latitude, longitude: e.longitude })),
    [events]
  );

  const handleMarkerPress = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (e) setSelected(e);
  };

  const fCount = activeFilterCount(filters);

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="map-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandMark}>MAPA</Text>
          <Text style={styles.brandSub}>{events.length} AKCÍ V PRAZE</Text>
        </View>
        <Pressable
          testID="map-filter-btn"
          style={[styles.filterBtn, fCount > 0 && styles.filterBtnActive]}
          onPress={() => setOpen(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={fCount > 0 ? colors.onBrand : colors.onSurface}
          />
          {fCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{fCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.mapWrap} testID="map-wrap">
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <EventsMap markers={markers} onMarkerPress={handleMarkerPress} />
        )}
      </View>

      {selected && (
        <View style={styles.sheet} testID="map-sheet">
          <View style={styles.sheetHandle} />
          <View style={styles.sheetRow}>
            <Image source={{ uri: selected.image_url }} style={styles.sheetImage} contentFit="cover" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.sheetType}>
                {eventTypeLabel(selected.event_type).toUpperCase()}
              </Text>
              <Text style={styles.sheetTitle} numberOfLines={2}>{selected.title}</Text>
              <Text style={styles.sheetMeta} numberOfLines={1}>
                {formatDate(selected.date)} · {selected.time}
              </Text>
              <Text style={styles.sheetMeta} numberOfLines={1}>{selected.venue}</Text>
            </View>
          </View>
          <View style={styles.sheetActions}>
            <Pressable style={styles.sheetClose} onPress={() => setSelected(null)} testID="map-sheet-close">
              <Text style={styles.sheetCloseText}>ZAVŘÍT</Text>
            </Pressable>
            <Pressable
              style={styles.sheetOpen}
              onPress={() => {
                const id = selected.id;
                setSelected(null);
                router.push(`/event/${id}`);
              }}
              testID="map-sheet-open"
            >
              <Text style={styles.sheetOpenText}>OTEVŘÍT DETAIL →</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FilterSheet
        visible={open}
        initial={filters}
        onClose={() => setOpen(false)}
        onApply={setFilters}
        hasLocation={!!geo.coords}
      />
    </SafeAreaView>
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
  brandMark: { fontSize: 24, fontWeight: "900", letterSpacing: -1, color: colors.onSurface },
  brandSub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.brand,
    fontFamily: "Courier",
    marginTop: 2,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.onSurfaceInverse, fontSize: 10, fontWeight: "800" },
  mapWrap: { flex: 1, backgroundColor: colors.surfaceSecondary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetHandle: { width: 48, height: 3, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.xs },
  sheetRow: { flexDirection: "row", gap: spacing.md },
  sheetImage: { width: 84, height: 84, backgroundColor: colors.surfaceSecondary },
  sheetType: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: colors.brand },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: colors.onSurface, letterSpacing: -0.3 },
  sheetMeta: { fontSize: 12, color: colors.onSurfaceSecondary },
  sheetActions: { flexDirection: "row", gap: spacing.sm },
  sheetClose: { flex: 1, height: 48, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  sheetCloseText: { fontWeight: "800", letterSpacing: 1.2, color: colors.onSurface },
  sheetOpen: { flex: 1.4, height: 48, backgroundColor: colors.surfaceInverse, alignItems: "center", justifyContent: "center" },
  sheetOpenText: { fontWeight: "800", letterSpacing: 1.2, color: colors.onSurfaceInverse },
});
