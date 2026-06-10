import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/src/theme";
import { listOrganizers, type Organizer } from "@/src/api";

export default function OrganizersScreen() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await listOrganizers();
        setOrganizers(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="organizers-screen"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ORGANIZÁTOŘI</Text>
        <Text style={styles.headerSub}>
          KULTURNÍ INSTITUCE A KNIHOVNY V PRAZE
        </Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <FlatList
          testID="organizers-list"
          data={organizers}
          keyExtractor={(it) => it.id}
          numColumns={2}
          columnWrapperStyle={{ borderBottomWidth: 1.5, borderBottomColor: colors.borderStrong }}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          renderItem={({ item, index }) => (
            <Pressable
              testID={`organizer-${item.id}`}
              style={[
                styles.cell,
                index % 2 === 0 && {
                  borderRightWidth: 1.5,
                  borderRightColor: colors.borderStrong,
                },
              ]}
              onPress={() => router.push(`/organizer/${item.id}`)}
            >
              <Image
                source={{ uri: item.logo }}
                style={styles.cellImage}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.cellBody}>
                <Text style={styles.cellName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.cellLink}>OTEVŘÍT →</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: colors.onSurface,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.brand,
    fontFamily: "Courier",
    marginTop: 4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cell: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  cellImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  cellBody: {
    padding: spacing.md,
    gap: 6,
  },
  cellName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  cellLink: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1.2,
    fontFamily: "Courier",
  },
});
