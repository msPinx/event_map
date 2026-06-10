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
import { colors, spacing, EVENT_TYPES, LANGUAGES } from "@/src/theme";
import {
  adminCreateEvent,
  adminUpdateEvent,
  getEvent,
  listOrganizers,
  type EventInput,
  type Organizer,
  type ProgramItem,
} from "@/src/api";
import { useAdminAuth } from "@/src/admin/auth";

const TYPES = EVENT_TYPES.filter((t) => t.id !== "all");

type FormState = EventInput;

const EMPTY: FormState = {
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  address: "",
  latitude: 50.0875,
  longitude: 14.4189,
  organizer_ids: [],
  event_type: "autorske_cteni",
  image_url: "",
  ticket_url: "",
  book_url: "",
  author: "",
  language: "cs",
  publisher: "",
  for_children: false,
  program: [],
  links: [],
};

export default function EventForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { pin } = useAdminAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!id;

  useEffect(() => {
    (async () => {
      try {
        const orgs = await listOrganizers();
        setOrganizers(orgs);
        if (id) {
          const e = await getEvent(id);
          setForm({
            title: e.title,
            description: e.description,
            date: e.date,
            time: e.time,
            venue: e.venue,
            address: e.address,
            latitude: e.latitude,
            longitude: e.longitude,
            organizer_ids: e.organizer_ids,
            event_type: e.event_type,
            image_url: e.image_url,
            ticket_url: e.ticket_url ?? "",
            book_url: e.book_url ?? "",
            author: e.author ?? "",
            language: e.language || "cs",
            publisher: e.publisher ?? "",
            for_children: e.for_children,
            program: e.program ?? [],
            links: e.links ?? [],
          });
        }
      } catch (e: any) {
        setError(e?.message ?? "Chyba načítání");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleOrganizer = (oid: string) => {
    setForm((f) => ({
      ...f,
      organizer_ids: f.organizer_ids.includes(oid)
        ? f.organizer_ids.filter((x) => x !== oid)
        : [...f.organizer_ids, oid],
    }));
  };

  const addProgram = () =>
    update("program", [...form.program, { time: "", title: "", speaker: "" }] as ProgramItem[]);
  const setProgram = (i: number, k: keyof ProgramItem, v: string) =>
    update(
      "program",
      form.program.map((p, idx) => (idx === i ? { ...p, [k]: v } : p))
    );
  const delProgram = (i: number) =>
    update("program", form.program.filter((_, idx) => idx !== i));

  const addLink = () => update("links", [...form.links, { label: "", url: "" }]);
  const setLink = (i: number, k: "label" | "url", v: string) =>
    update("links", form.links.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const delLink = (i: number) => update("links", form.links.filter((_, idx) => idx !== i));

  const validate = (): string | null => {
    if (!form.title.trim()) return "Vyplňte název";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date))
      return "Datum musí být ve formátu RRRR-MM-DD";
    if (!/^\d{1,2}:\d{2}$/.test(form.time)) return "Čas musí být ve formátu HH:MM";
    if (!form.venue.trim()) return "Vyplňte místo";
    if (!form.address.trim()) return "Vyplňte adresu";
    if (form.organizer_ids.length === 0) return "Vyberte alespoň jednoho organizátora";
    if (!form.image_url.trim()) return "Vyplňte URL obrázku";
    return null;
  };

  const handleSave = async () => {
    if (!pin) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: EventInput = {
        ...form,
        ticket_url: form.ticket_url?.trim() || null,
        book_url: form.book_url?.trim() || null,
        author: form.author?.trim() || null,
        publisher: form.publisher?.trim() || null,
        program: form.program.filter((p) => p.time.trim() && p.title.trim()),
        links: form.links.filter((l) => l.label.trim() && l.url.trim()),
      };
      if (isEdit && id) await adminUpdateEvent(pin, id, payload);
      else await adminCreateEvent(pin, payload);
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
    <SafeAreaView style={styles.container} edges={["top"]} testID="admin-event-form">
      <View style={styles.header}>
        <Pressable testID="admin-form-back" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{isEdit ? "UPRAVIT" : "NOVÁ UDÁLOST"}</Text>
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
            <Field label="NÁZEV *">
              <TextInput style={styles.input} value={form.title} onChangeText={(v) => update("title", v)} placeholder="Autorské čtení..." placeholderTextColor={colors.muted} testID="ef-title" />
            </Field>
            <Field label="POPIS">
              <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={(v) => update("description", v)} multiline placeholder="Popis akce..." placeholderTextColor={colors.muted} testID="ef-description" />
            </Field>

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Field label="DATUM *" style={{ flex: 1 }}>
                <TextInput style={styles.input} value={form.date} onChangeText={(v) => update("date", v)} placeholder="2026-06-15" placeholderTextColor={colors.muted} autoCapitalize="none" testID="ef-date" />
              </Field>
              <Field label="ČAS *" style={{ flex: 1 }}>
                <TextInput style={styles.input} value={form.time} onChangeText={(v) => update("time", v)} placeholder="19:00" placeholderTextColor={colors.muted} testID="ef-time" />
              </Field>
            </View>

            <Field label="TYP *">
              <ChipMulti
                options={TYPES}
                values={[form.event_type]}
                onChange={(v) => update("event_type", v as any)}
                testIDPrefix="ef-type"
                single
              />
            </Field>

            <Field label="JAZYK *">
              <ChipMulti
                options={LANGUAGES}
                values={[form.language]}
                onChange={(v) => update("language", v as any)}
                testIDPrefix="ef-lang"
                single
              />
            </Field>

            <Field label="ORGANIZÁTOŘI * (lze vybrat víc)">
              <ChipMulti
                options={organizers.map((o) => ({ id: o.id, label: o.name }))}
                values={form.organizer_ids}
                onChange={toggleOrganizer}
                testIDPrefix="ef-org"
              />
            </Field>

            <Field label="MÍSTO (VENUE) *">
              <TextInput style={styles.input} value={form.venue} onChangeText={(v) => update("venue", v)} placeholder="Knihovna Václava Havla" placeholderTextColor={colors.muted} testID="ef-venue" />
            </Field>
            <Field label="ADRESA *">
              <TextInput style={styles.input} value={form.address} onChangeText={(v) => update("address", v)} placeholder="Ostrovní 13, Praha 1" placeholderTextColor={colors.muted} testID="ef-address" />
            </Field>

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Field label="LAT" style={{ flex: 1 }}>
                <TextInput style={styles.input} value={String(form.latitude)} onChangeText={(v) => update("latitude", parseFloat(v) || 0)} keyboardType="numeric" placeholder="50.08" placeholderTextColor={colors.muted} testID="ef-lat" />
              </Field>
              <Field label="LON" style={{ flex: 1 }}>
                <TextInput style={styles.input} value={String(form.longitude)} onChangeText={(v) => update("longitude", parseFloat(v) || 0)} keyboardType="numeric" placeholder="14.42" placeholderTextColor={colors.muted} testID="ef-lon" />
              </Field>
            </View>

            <Field label="URL OBRÁZKU *">
              <TextInput style={styles.input} value={form.image_url} onChangeText={(v) => update("image_url", v)} placeholder="https://..." placeholderTextColor={colors.muted} autoCapitalize="none" testID="ef-image" />
            </Field>
            <Field label="URL VSTUPENEK">
              <TextInput style={styles.input} value={form.ticket_url ?? ""} onChangeText={(v) => update("ticket_url", v)} placeholder="https://..." placeholderTextColor={colors.muted} autoCapitalize="none" testID="ef-ticket" />
            </Field>
            <Field label="URL KNIHY (proklik na knihu)">
              <TextInput style={styles.input} value={form.book_url ?? ""} onChangeText={(v) => update("book_url", v)} placeholder="https://www.kosmas.cz/..." placeholderTextColor={colors.muted} autoCapitalize="none" testID="ef-book" />
            </Field>
            <Field label="AUTOR">
              <TextInput style={styles.input} value={form.author ?? ""} onChangeText={(v) => update("author", v)} placeholder="Jméno autora" placeholderTextColor={colors.muted} testID="ef-author" />
            </Field>
            <Field label="NAKLADATELSTVÍ">
              <TextInput style={styles.input} value={form.publisher ?? ""} onChangeText={(v) => update("publisher", v)} placeholder="Host, Paseka, ..." placeholderTextColor={colors.muted} testID="ef-publisher" />
            </Field>

            <Pressable
              testID="ef-kids"
              style={[styles.toggle, form.for_children && styles.toggleOn]}
              onPress={() => update("for_children", !form.for_children)}
            >
              <Ionicons
                name={form.for_children ? "checkbox" : "square-outline"}
                size={20}
                color={form.for_children ? colors.onBrand : colors.onSurface}
              />
              <Text style={[styles.toggleText, form.for_children && { color: colors.onBrand }]}>
                AKCE PRO DĚTI
              </Text>
            </Pressable>

            {/* Program */}
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.fieldLabel, { flex: 1 }]}>PROGRAM (volitelné)</Text>
                <Pressable testID="ef-add-program" style={styles.smallAddBtn} onPress={addProgram}>
                  <Ionicons name="add" size={18} color={colors.onBrand} />
                </Pressable>
              </View>
              {form.program.map((p, i) => (
                <View key={i} style={styles.subRow} testID={`ef-prog-${i}`}>
                  <TextInput style={[styles.input, { width: 70 }]} value={p.time} onChangeText={(v) => setProgram(i, "time", v)} placeholder="19:00" placeholderTextColor={colors.muted} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <TextInput style={styles.input} value={p.title} onChangeText={(v) => setProgram(i, "title", v)} placeholder="Bod programu" placeholderTextColor={colors.muted} />
                    <TextInput style={styles.input} value={p.speaker ?? ""} onChangeText={(v) => setProgram(i, "speaker", v)} placeholder="Mluvčí (volitelné)" placeholderTextColor={colors.muted} />
                  </View>
                  <Pressable style={styles.delSmallBtn} onPress={() => delProgram(i)}>
                    <Ionicons name="close" size={18} color={colors.onBrand} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Additional links */}
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.fieldLabel, { flex: 1 }]}>DALŠÍ ODKAZY (volitelné)</Text>
                <Pressable testID="ef-add-link" style={styles.smallAddBtn} onPress={addLink}>
                  <Ionicons name="add" size={18} color={colors.onBrand} />
                </Pressable>
              </View>
              {form.links.map((l, i) => (
                <View key={i} style={styles.subRow} testID={`ef-link-${i}`}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <TextInput style={styles.input} value={l.label} onChangeText={(v) => setLink(i, "label", v)} placeholder="Popisek (Facebook, plakát…)" placeholderTextColor={colors.muted} />
                    <TextInput style={styles.input} value={l.url} onChangeText={(v) => setLink(i, "url", v)} placeholder="https://..." placeholderTextColor={colors.muted} autoCapitalize="none" />
                  </View>
                  <Pressable style={styles.delSmallBtn} onPress={() => delLink(i)}>
                    <Ionicons name="close" size={18} color={colors.onBrand} />
                  </Pressable>
                </View>
              ))}
            </View>

            {error && (
              <View style={styles.errorBlock}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.ctaWrap}>
          <Pressable testID="ef-save-btn" style={styles.ctaPrimary} onPress={handleSave} disabled={saving}>
            <Text style={styles.ctaPrimaryText}>
              {saving ? "UKLÁDÁM…" : isEdit ? "ULOŽIT ZMĚNY →" : "VYTVOŘIT UDÁLOST →"}
            </Text>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipMulti({
  options,
  values,
  onChange,
  testIDPrefix,
  single,
}: {
  options: { id: string; label: string }[];
  values: string[];
  onChange: (id: string) => void;
  testIDPrefix: string;
  single?: boolean;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const active = values.includes(o.id);
        return (
          <Pressable
            key={o.id}
            testID={`${testIDPrefix}-${o.id}`}
            style={[styles.smallChip, active ? styles.smallChipActive : styles.smallChipInactive]}
            onPress={() => onChange(o.id)}
          >
            <Text
              style={[
                styles.smallChipText,
                active ? styles.smallChipTextActive : styles.smallChipTextInactive,
              ]}
              numberOfLines={1}
            >
              {o.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
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
  title: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, color: colors.onSurface },
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    maxWidth: "100%",
  },
  smallChipActive: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  smallChipInactive: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  smallChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  smallChipTextActive: { color: colors.onSurfaceInverse },
  smallChipTextInactive: { color: colors.onSurface },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  toggleOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  toggleText: { fontWeight: "800", letterSpacing: 1.2, color: colors.onSurface, fontSize: 12 },
  smallAddBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  subRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  delSmallBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBlock: { backgroundColor: colors.brand, padding: spacing.md },
  errorText: { color: colors.onBrand, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
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
  ctaPrimaryText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5, fontSize: 14 },
});
