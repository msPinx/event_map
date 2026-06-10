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

export default function LoginScreen() {
  const router = useRouter();
  const { signInEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !pwd) {
      setErr("Vyplň e-mail a heslo");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await signInEmail(email.trim().toLowerCase(), pwd);
      router.replace("/account");
    } catch (e: any) {
      setErr(e?.message ?? "Přihlášení selhalo");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    setErr(null);
    try {
      await signInGoogle();
      router.replace("/account");
    } catch (e: any) {
      setErr(e?.message ?? "Přihlášení Googlem selhalo");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]} testID="login-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable testID="login-back" style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>PŘIHLÁŠENÍ</Text>
          <Text style={styles.sub}>VÍTEJ ZPĚT</Text>
          <View style={styles.divider} />

          <Pressable
            testID="login-google-btn"
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={gLoading}
          >
            <Ionicons name="logo-google" size={18} color={colors.onSurface} />
            <Text style={styles.googleText}>
              {gLoading ? "PŘIHLAŠUJI..." : "POKRAČOVAT S GOOGLE"}
            </Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>NEBO</Text>
            <View style={styles.orLine} />
          </View>

          <Text style={styles.label}>E-MAIL</Text>
          <TextInput
            testID="login-email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="jan@example.cz"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>HESLO</Text>
          <TextInput
            testID="login-password"
            style={styles.input}
            value={pwd}
            onChangeText={setPwd}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />

          {err && (
            <View style={styles.errorBlock} testID="login-error">
              <Text style={styles.errorText}>{err.toUpperCase()}</Text>
            </View>
          )}

          <Pressable
            testID="login-submit"
            style={styles.primaryBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Text style={styles.primaryText}>PŘIHLÁSIT SE →</Text>
            )}
          </Pressable>

          <Pressable
            testID="login-to-register"
            style={styles.linkBtn}
            onPress={() => router.replace("/auth/register")}
          >
            <Text style={styles.linkBtnText}>NEMÁŠ ÚČET? <Text style={{ color: colors.brand }}>REGISTRUJ SE</Text></Text>
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
  body: { padding: spacing.xl, gap: spacing.md },
  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: colors.onSurface,
  },
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
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5 },
  linkBtn: { alignItems: "center", paddingVertical: spacing.md },
  linkBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.onSurface,
  },
  errorBlock: { backgroundColor: colors.brand, padding: spacing.md },
  errorText: { color: colors.onBrand, fontWeight: "800", fontSize: 12, letterSpacing: 1 },
});
