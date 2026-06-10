import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing } from "@/src/theme";
import {
  getOrganizer,
  getOrganizerEvents,
  type Organizer,
  type Event,
} from "@/src/api";
import EventCard from "@/src/components/EventCard";

export default function OrganizerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Organizer | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [o, e] = await Promise.all([
          getOrganizer(id),
          getOrganizerEvents(id),
        ]);
        setOrg(o);
        setEvents(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} testID="organizer-detail-loading">
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!org) {
    return (
      <SafeAreaView style={styles.container} testID="organizer-detail-error">
        <Text style={styles.errorText}>ORGANIZÁTOR NENALEZEN</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} testID="organizer-detail-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: org.logo }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <SafeAreaView edges={["top"]} style={styles.topBar}>
            <Pressable
              testID="organizer-back-btn"
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.tag}>ORGANIZÁTOR</Text>
          <Text style={styles.title} testID="organizer-name">
            {org.name}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.description}>{org.description}</Text>

          <Pressable
            testID="organizer-website-btn"
            style={styles.websiteBtn}
            onPress={() => Linking.openURL(org.website)}
          >
            <Ionicons name="globe-outline" size={18} color={colors.onSurfaceInverse} />
            <Text style={styles.websiteBtnText}>NAVŠTÍVIT WEB →</Text>
          </Pressable>
        </View>

        <View style={styles.eventsHeader}>
          <Text style={styles.eventsHeaderText}>
            NADCHÁZEJÍCÍ UDÁLOSTI · {events.length}
          </Text>
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Žádné nadcházející události.</Text>
          </View>
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  heroWrap: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: colors.surfaceSecondary,
  },
  heroImage: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.lg, gap: spacing.md },
  tag: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -1,
    lineHeight: 32,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.xs,
  },
  description: {
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 22,
  },
  websiteBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceInverse,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  websiteBtnText: {
    color: colors.onSurfaceInverse,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  eventsHeader: {
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderStrong,
  },
  eventsHeaderText: {
    color: colors.onSurfaceInverse,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: "Courier",
    fontSize: 12,
  },
  emptyBlock: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 13 },
  errorText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1.5,
    fontFamily: "Courier",
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
