import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing } from "@/src/theme";
import {
  adminCreateOrganizer,
  adminUpdateOrganizer,
  getOrganizer,
  type OrganizerInput,
} from "@/src/api";
import { useAdminAuth } from "@/src/admin/auth";

const EMPTY: OrganizerInput = {
  name: "",
  description: "",
  website: "",
  logo: "",
};

export default function OrganizerForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { pin } = useAdminAuth();
  const [form, setForm] = useState<OrganizerInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!id;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const o = await getOrganizer(id);
        setForm({
          name: o.name,
          description: o.description,
          website: o.website,
          logo: o.logo,
        });
      } catch (e: any) {
        setError(e?.message ?? "Chyba načítání");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const update = <K extends keyof OrganizerInput>(k: K, v: OrganizerInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!pin) return;
    if (!form.name.trim()) {
      setError("Vyplňte název");
      return;
    }
    if (!form.logo.trim()) {
      setError("Vyplňte URL loga");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await adminUpdateOrganizer(pin, id, form);
      } else {
        await adminCreateOrganizer(pin, form);
      }
      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Uložení selhalo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
      testID="admin-organizer-form"
    >
      <View style={styles.header}>
        <Pressable
          testID="admin-form-back"
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isEdit ? "UPRAVIT ORGANIZÁTORA" : "NOVÝ ORGANIZÁTOR"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Field label="NÁZEV" required>
              <TextInput
                testID="of-name"
                style={styles.input}
                value={form.name}
                onChangeText={(v) => update("name", v)}
                placeholder="Knihovna Václava Havla"
                placeholderTextColor={colors.muted}
              />
            </Field>

            <Field label="POPIS">
              <TextInput
                testID="of-description"
                style={[styles.input, styles.textarea]}
                value={form.description}
                onChangeText={(v) => update("description", v)}
                placeholder="Krátký popis organizace…"
                placeholderTextColor={colors.muted}
                multiline
              />
            </Field>

            <Field label="WEBOVÁ STRÁNKA">
              <TextInput
                testID="of-website"
                style={styles.input}
                value={form.website}
                onChangeText={(v) => update("website", v)}
                placeholder="https://www.vaclavhavel.cz"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </Field>

            <Field label="URL LOGA / OBRÁZKU" required>
              <TextInput
                testID="of-logo"
                style={styles.input}
                value={form.logo}
                onChangeText={(v) => update("logo", v)}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </Field>

            {error && (
              <View style={styles.errorBlock} testID="of-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.ctaWrap}>
          <Pressable
            testID="of-save-btn"
            style={styles.ctaPrimary}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.ctaPrimaryText}>
              {saving
                ? "UKLÁDÁM…"
                : isEdit
                ? "ULOŽIT ZMĚNY →"
                : "VYTVOŘIT ORGANIZÁTORA →"}
            </Text>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>
      {children}
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
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.onSurface,
  },
  form: { padding: spacing.lg, gap: spacing.lg },
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
    backgroundColor: colors.surface,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  errorBlock: { backgroundColor: colors.brand, padding: spacing.md },
  errorText: {
    color: colors.onBrand,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
  },
  ctaPrimary: {
    margin: spacing.lg,
    backgroundColor: colors.brand,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaPrimaryText: {
    color: colors.onBrand,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 14,
  },
});
