import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { colors, spacing, eventTypeLabel, formatDate } from "@/src/theme";
import { useAdminAuth } from "@/src/admin/auth";
import {
  adminDeleteEvent,
  adminDeleteOrganizer,
  adminLogin,
  listEvents,
  listOrganizers,
  type Event,
  type Organizer,
} from "@/src/api";

export default function AdminHome() {
  const { pin, setPin, ready } = useAdminAuth();
  const [pinInput, setPinInput] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    if (!pinInput) return;
    setLoginLoading(true);
    setLoginErr(null);
    try {
      const ok = await adminLogin(pinInput);
      if (ok) {
        await setPin(pinInput);
        setPinInput("");
      } else {
        setLoginErr("Neplatný PIN");
      }
    } catch {
      setLoginErr("Chyba spojení");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!pin) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
        testID="admin-login"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.loginBody}>
            <Text style={styles.brand}>ADMIN</Text>
            <Text style={styles.brandSub}>VSTUP CHRÁNĚN PINEM</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>PIN</Text>
            <TextInput
              testID="admin-pin-input"
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="••••"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              secureTextEntry
              style={styles.pinInput}
              maxLength={12}
              onSubmitEditing={handleLogin}
            />
            {loginErr && (
              <Text style={styles.error} testID="admin-login-error">
                {loginErr.toUpperCase()}
              </Text>
            )}
            <Pressable
              testID="admin-login-btn"
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              <Text style={styles.loginBtnText}>
                {loginLoading ? "OVĚŘUJI…" : "POKRAČOVAT →"}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              Výchozí PIN je <Text style={styles.mono}>1234</Text> (lze změnit
              v backend/.env: ADMIN_PIN).
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return <AdminDashboard pin={pin} onLogout={() => setPin(null)} />;
}

function AdminDashboard({
  pin,
  onLogout,
}: {
  pin: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"events" | "organizers">("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, o] = await Promise.all([listEvents(), listOrganizers()]);
      setEvents(e);
      setOrganizers(o);
    } catch (err: any) {
      setError(err?.message ?? "Chyba spojení");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDeleteEvent = async (id: string) => {
    try {
      await adminDeleteEvent(pin, id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Smazání selhalo");
    }
  };

  const handleDeleteOrg = async (id: string) => {
    try {
      await adminDeleteOrganizer(pin, id);
      setOrganizers((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Smazání selhalo");
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="admin-dashboard"
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>ADMIN</Text>
          <Text style={styles.brandSub}>SPRÁVA OBSAHU</Text>
        </View>
        <Pressable
          testID="admin-logout-btn"
          style={styles.logoutBtn}
          onPress={onLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.onSurface} />
          <Text style={styles.logoutText}>ODHLÁSIT</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          testID="admin-tab-events"
          style={[
            styles.tabBtn,
            tab === "events" ? styles.tabActive : styles.tabInactive,
          ]}
          onPress={() => setTab("events")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "events" ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            UDÁLOSTI · {events.length}
          </Text>
        </Pressable>
        <Pressable
          testID="admin-tab-organizers"
          style={[
            styles.tabBtn,
            tab === "organizers" ? styles.tabActive : styles.tabInactive,
          ]}
          onPress={() => setTab("organizers")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "organizers"
                ? styles.tabTextActive
                : styles.tabTextInactive,
            ]}
          >
            ORGANIZÁTOŘI · {organizers.length}
          </Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner} testID="admin-error">
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          testID={`admin-list-${tab}`}
        >
          {tab === "events"
            ? events.map((e) => (
                <View
                  key={e.id}
                  style={styles.listRow}
                  testID={`admin-event-row-${e.id}`}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.listType}>
                      {eventTypeLabel(e.event_type).toUpperCase()}
                    </Text>
                    <Text style={styles.listTitle} numberOfLines={2}>
                      {e.title}
                    </Text>
                    <Text style={styles.listMeta} numberOfLines={1}>
                      {formatDate(e.date)} · {e.time} · {e.venue}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable
                      testID={`admin-edit-event-${e.id}`}
                      style={styles.actionBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/admin/event-form",
                          params: { id: e.id },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={18} color={colors.onSurface} />
                    </Pressable>
                    <Pressable
                      testID={`admin-delete-event-${e.id}`}
                      style={[styles.actionBtn, styles.actionDanger]}
                      onPress={() => handleDeleteEvent(e.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.onBrand} />
                    </Pressable>
                  </View>
                </View>
              ))
            : organizers.map((o) => (
                <View
                  key={o.id}
                  style={styles.listRow}
                  testID={`admin-organizer-row-${o.id}`}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.listType}>ORGANIZÁTOR</Text>
                    <Text style={styles.listTitle} numberOfLines={2}>
                      {o.name}
                    </Text>
                    <Text style={styles.listMeta} numberOfLines={1}>
                      {o.website}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable
                      testID={`admin-edit-organizer-${o.id}`}
                      style={styles.actionBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/admin/organizer-form",
                          params: { id: o.id },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={18} color={colors.onSurface} />
                    </Pressable>
                    <Pressable
                      testID={`admin-delete-organizer-${o.id}`}
                      style={[styles.actionBtn, styles.actionDanger]}
                      onPress={() => handleDeleteOrg(o.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.onBrand} />
                    </Pressable>
                  </View>
                </View>
              ))}
        </ScrollView>
      )}

      <SafeAreaView edges={["bottom"]} style={styles.fabWrap}>
        <Pressable
          testID="admin-add-btn"
          style={styles.fab}
          onPress={() =>
            router.push(
              tab === "events"
                ? "/admin/event-form"
                : "/admin/organizer-form"
            )
          }
        >
          <Ionicons name="add" size={22} color={colors.onBrand} />
          <Text style={styles.fabText}>
            {tab === "events" ? "NOVÁ UDÁLOST" : "NOVÝ ORGANIZÁTOR"}
          </Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loginBody: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    gap: spacing.md,
  },
  brand: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: colors.onSurface,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
    marginTop: 4,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: "Courier",
  },
  pinInput: {
    borderBottomWidth: 2,
    borderBottomColor: colors.onSurface,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    color: colors.onSurface,
    paddingVertical: spacing.sm,
  },
  loginBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
  },
  loginBtnText: {
    color: colors.onBrand,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  error: {
    color: colors.brand,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: "Courier",
    fontSize: 12,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.md,
  },
  mono: { fontFamily: "Courier", fontWeight: "700" },
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
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.onSurface,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
  },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { backgroundColor: colors.surfaceInverse },
  tabInactive: { backgroundColor: colors.surface },
  tabText: { fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  tabTextActive: { color: colors.onSurfaceInverse },
  tabTextInactive: { color: colors.muted },
  errorBanner: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorBannerText: {
    color: colors.onBrand,
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
    gap: spacing.md,
  },
  listType: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.brand,
    fontFamily: "Courier",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  listMeta: { fontSize: 12, color: colors.onSurfaceSecondary },
  rowActions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDanger: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    margin: spacing.lg,
    backgroundColor: colors.brand,
    paddingVertical: 16,
  },
  fabText: {
    color: colors.onBrand,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 13,
  },
});
