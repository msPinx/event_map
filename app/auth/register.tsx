import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/src/theme";
import { useAuth } from "@/src/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpEmail, signInGoogle } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    gdpr_marketing: false,
    gdpr_post_event_summary: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setErr("Vyplň prosím všechna povinná pole");
      return;
    }
    if (form.password.length < 6) {
      setErr("Heslo musí mít alespoň 6 znaků");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await signUpEmail({
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      router.replace("/account");
    } catch (e: any) {
      setErr(e?.message ?? "Registrace selhala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]} testID="register-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable testID="reg-back" style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>REGISTRACE</Text>
          <Text style={styles.sub}>VYTVOŘ SI ČTENÁŘSKÝ PROFIL</Text>
          <View style={styles.divider} />

          <Pressable
            testID="reg-google-btn"
            style={styles.googleBtn}
            onPress={signInGoogle}
          >
            <Ionicons name="logo-google" size={18} color={colors.onSurface} />
            <Text style={styles.googleText}>POKRAČOVAT S GOOGLE</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>NEBO E-MAILEM</Text>
            <View style={styles.orLine} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>JMÉNO *</Text>
              <TextInput
                testID="reg-first"
                style={styles.input}
                value={form.first_name}
                onChangeText={(v) => set("first_name", v)}
                placeholder="Jan"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.label}>PŘÍJMENÍ *</Text>
              <TextInput
                testID="reg-last"
                style={styles.input}
                value={form.last_name}
                onChangeText={(v) => set("last_name", v)}
                placeholder="Novák"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          <Text style={styles.label}>E-MAIL *</Text>
          <TextInput
            testID="reg-email"
            style={styles.input}
            value={form.email}
            onChangeText={(v) => set("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="jan@example.cz"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>HESLO * (MIN. 6 ZNAKŮ)</Text>
          <TextInput
            testID="reg-password"
            style={styles.input}
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />

          <View style={styles.gdprBox}>
            <Text style={styles.gdprTitle}>GDPR SOUHLAS</Text>
            <Pressable
              testID="reg-gdpr-marketing"
              style={styles.checkRow}
              onPress={() => set("gdpr_marketing", !form.gdpr_marketing)}
            >
              <Ionicons
                name={form.gdpr_marketing ? "checkbox" : "square-outline"}
                size={20}
                color={form.gdpr_marketing ? colors.brand : colors.onSurface}
              />
              <Text style={styles.checkText}>
                Souhlasím se zasíláním komerčních sdělení (newsletter, doporučení akcí).
              </Text>
            </Pressable>
            <Pressable
              testID="reg-gdpr-summary"
              style={styles.checkRow}
              onPress={() => set("gdpr_post_event_summary", !form.gdpr_post_event_summary)}
            >
              <Ionicons
                name={form.gdpr_post_event_summary ? "checkbox" : "square-outline"}
                size={20}
                color={form.gdpr_post_event_summary ? colors.brand : colors.onSurface}
              />
              <Text style={styles.checkText}>
                Souhlasím se zasíláním shrnutí po akci (fotky, materiály, hodnocení).
              </Text>
            </Pressable>
          </View>

          {err && (
            <View style={styles.errorBlock} testID="reg-error">
              <Text style={styles.errorText}>{err.toUpperCase()}</Text>
            </View>
          )}

          <Pressable
            testID="reg-submit"
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Text style={styles.primaryText}>VYTVOŘIT ÚČET →</Text>
            )}
          </Pressable>

          <Pressable
            testID="reg-to-login"
            style={styles.linkBtn}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.linkBtnText}>
              MÁŠ JIŽ ÚČET? <Text style={{ color: colors.brand }}>PŘIHLÁSIT SE</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1.2, color: colors.onSurface },
  sub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
  },
  divider: { height: 1.5, backgroundColor: colors.borderStrong, marginVertical: spacing.md },
  label: {
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
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingVertical: 16,
  },
  googleText: { fontWeight: "900", letterSpacing: 1.2, color: colors.onSurface },
  orRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.sm },
  orLine: { flex: 1, height: 1.5, backgroundColor: colors.borderStrong },
  orText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: colors.muted },
  gdprBox: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  gdprTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  checkText: { flex: 1, fontSize: 12, color: colors.onSurface, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5 },
  linkBtn: { alignItems: "center", paddingVertical: spacing.md },
  linkBtnText: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2, color: colors.onSurface },
  errorBlock: { backgroundColor: colors.brand, padding: spacing.md },
  errorText: { color: colors.onBrand, fontWeight: "800", fontSize: 12, letterSpacing: 1 },
});
