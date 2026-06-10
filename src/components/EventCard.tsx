import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, spacing, eventTypeLabel, shortDate } from "@/src/theme";
import type { Event } from "@/src/api";

type Props = {
  event: Event;
  variant?: "hero" | "row";
};

export default function EventCard({ event, variant = "row" }: Props) {
  const router = useRouter();
  const { day, month } = shortDate(event.date);

  if (variant === "hero") {
    return (
      <Pressable
        testID={`hero-event-${event.id}`}
        onPress={() => router.push(`/event/${event.id}`)}
        style={styles.hero}
      >
        <Image
          source={{ uri: event.image_url }}
          style={styles.heroImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroTypeRow}>
            <Text style={styles.heroType}>
              {eventTypeLabel(event.event_type).toUpperCase()}
            </Text>
            <View style={styles.heroDot} />
            <Text style={styles.heroDate}>
              {day}.{event.date.split("-")[1]}.{event.date.split("-")[0]} · {event.time}
            </Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={3}>
            {event.title}
          </Text>
          <Text style={styles.heroVenue} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={`event-card-${event.id}`}
      onPress={() => router.push(`/event/${event.id}`)}
      style={styles.row}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowType}>
          {eventTypeLabel(event.event_type).toUpperCase()}
        </Text>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.rowVenue} numberOfLines={1}>
          {event.time} · {event.venue}
        </Text>
      </View>
      <Image
        source={{ uri: event.image_url }}
        style={styles.rowImage}
        contentFit="cover"
        transition={150}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: colors.surfaceInverse,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
  },
  heroImage: { width: "100%", height: "100%" },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
  },
  heroTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroType: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroDot: {
    width: 4,
    height: 4,
    backgroundColor: colors.onSurfaceInverse,
    marginHorizontal: spacing.sm,
  },
  heroDate: {
    color: colors.onSurfaceInverse,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: "Courier",
  },
  heroTitle: {
    color: colors.onSurfaceInverse,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -1,
  },
  heroVenue: {
    color: colors.onSurfaceInverse,
    fontSize: 14,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: spacing.md,
  },
  dateBlock: {
    width: 56,
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: colors.borderStrong,
    paddingRight: spacing.md,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -1,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1.2,
    fontFamily: "Courier",
  },
  rowContent: { flex: 1, gap: 4 },
  rowType: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1.2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  rowVenue: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
  },
  rowImage: {
    width: 70,
    height: 70,
    backgroundColor: colors.surfaceSecondary,
  },
});
