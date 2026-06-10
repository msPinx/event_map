// Web fallback for MapViews. No react-native-maps import on web.
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/src/theme";

export type MarkerItem = {
  id: string;
  latitude: number;
  longitude: number;
};

export function EventsMap({
  markers,
  onMarkerPress,
}: {
  markers: MarkerItem[];
  onMarkerPress: (id: string) => void;
}) {
  return (
    <View style={styles.box} testID="map-web-fallback">
      <Text style={styles.title}>MAPA — NÁHLED</Text>
      <Text style={styles.text}>
        Interaktivní mapa je dostupná na mobilním zařízení (iOS / Android).
        Použijte aplikaci Expo Go pro plný zážitek.
      </Text>
      <View style={styles.list}>
        {markers.map((m) => (
          <Pressable
            key={m.id}
            style={styles.row}
            onPress={() => onMarkerPress(m.id)}
            testID={`map-marker-${m.id}`}
          >
            <View style={styles.marker} />
            <Text style={styles.coord}>
              {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SingleLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <View style={styles.singleBox} testID="single-map-web-fallback">
      <Ionicons name="location" size={24} color={colors.brand} />
      <Text style={styles.singleText}>
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </Text>
    </View>
  );
}

export const __isNativeMap = false;

const styles = StyleSheet.create({
  box: { flex: 1, padding: spacing.lg, backgroundColor: colors.surfaceSecondary },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  text: { fontSize: 13, color: colors.muted, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  marker: { width: 14, height: 14, backgroundColor: colors.brand },
  coord: { fontFamily: "Courier", fontSize: 12, color: colors.onSurface },
  singleBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  singleText: { fontFamily: "Courier", fontSize: 13, color: colors.onSurface },
});
