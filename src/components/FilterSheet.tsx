import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, EVENT_TYPES, LANGUAGES } from "@/src/theme";
import { listOrganizers, getPublishers, type Organizer, type EventFilters } from "@/src/api";

export type Filters = {
  event_type?: string;
  organizer_id?: string;
  language?: string;
  publisher?: string;
  for_children?: boolean;
  date_from?: string;
  date_to?: string;
  use_location?: boolean;
  radius_km?: number;
};

export function toEventFilters(f: Filters, loc?: { lat: number; lng: number } | null): EventFilters {
  const out: EventFilters = {};
  if (f.event_type) out.event_type = f.event_type;
  if (f.organizer_id) out.organizer_id = f.organizer_id;
  if (f.language) out.language = f.language;
  if (f.publisher) out.publisher = f.publisher;
  if (f.for_children) out.for_children = true;
  if (f.date_from) out.date_from = f.date_from;
  if (f.date_to) out.date_to = f.date_to;
  if (f.use_location && loc && f.radius_km) {
    out.lat = loc.lat;
    out.lng = loc.lng;
    out.radius_km = f.radius_km;
  }
  return out;
}

export function activeFilterCount(f: Filters): number {
  let c = 0;
  if (f.event_type) c++;
  if (f.organizer_id) c++;
  if (f.language) c++;
  if (f.publisher) c++;
  if (f.for_children) c++;
  if (f.date_from || f.date_to) c++;
  if (f.use_location && f.radius_km) c++;
  return c;
}

export default function FilterSheet({
  visible,
  initial,
  onClose,
  onApply,
  hasLocation,
}: {
  visible: boolean;
  initial: Filters;
  onClose: () => void;
  onApply: (f: Filters) => void;
  hasLocation?: boolean;
}) {
  const [draft, setDraft] = useState<Filters>(initial);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [publishers, setPublishers] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  useEffect(() => {
    listOrganizers().then(setOrganizers).catch(() => {});
    getPublishers().then(setPublishers).catch(() => {});
  }, []);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const reset = () => setDraft({});

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]} testID="filter-sheet">
        <View style={styles.header}>
          <Text style={styles.title}>FILTRY</Text>
          <Pressable onPress={onClose} testID="filter-close" style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.onSurface} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 }}>
          <Section label="TYP UDÁLOSTI">
            <Chips
              options={EVENT_TYPES.filter((t) => t.id !== "all")}
              value={draft.event_type}
              onChange={(v) => set("event_type", v === draft.event_type ? undefined : v)}
              testIDPrefix="filter-type"
            />
          </Section>

          <Section label="JAZYK">
            <Chips
              options={LANGUAGES}
              value={draft.language}
              onChange={(v) => set("language", v === draft.language ? undefined : v)}
              testIDPrefix="filter-lang"
            />
          </Section>

          <Section label="PRO DĚTI">
            <Pressable
              testID="filter-kids"
              onPress={() => set("for_children", !draft.for_children)}
              style={[styles.toggle, draft.for_children ? styles.toggleOn : styles.toggleOff]}
            >
              <Ionicons
                name={draft.for_children ? "checkbox" : "square-outline"}
                size={20}
                color={draft.for_children ? colors.onBrand : colors.onSurface}
              />
              <Text style={[styles.toggleText, draft.for_children && { color: colors.onBrand }]}>
                ZOBRAZIT POUZE AKCE PRO DĚTI
              </Text>
            </Pressable>
          </Section>

          <Section label="DATUM (RRRR-MM-DD)">
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <TextInput
                testID="filter-date-from"
                placeholder="OD"
                placeholderTextColor={colors.muted}
                value={draft.date_from ?? ""}
                onChangeText={(v) => set("date_from", v || undefined)}
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="none"
              />
              <TextInput
                testID="filter-date-to"
                placeholder="DO"
                placeholderTextColor={colors.muted}
                value={draft.date_to ?? ""}
                onChangeText={(v) => set("date_to", v || undefined)}
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="none"
              />
            </View>
          </Section>

          <Section label="ORGANIZÁTOR">
            <Chips
              options={organizers.map((o) => ({ id: o.id, label: o.name }))}
              value={draft.organizer_id}
              onChange={(v) => set("organizer_id", v === draft.organizer_id ? undefined : v)}
              testIDPrefix="filter-org"
            />
          </Section>

          {publishers.length > 0 && (
            <Section label="NAKLADATELSTVÍ">
              <Chips
                options={publishers.map((p) => ({ id: p, label: p }))}
                value={draft.publisher}
                onChange={(v) => set("publisher", v === draft.publisher ? undefined : v)}
                testIDPrefix="filter-pub"
              />
            </Section>
          )}

          {hasLocation && (
            <Section label="LOKACE (KOLEM TVÉ POZICE)">
              <Pressable
                testID="filter-loc-on"
                onPress={() => set("use_location", !draft.use_location)}
                style={[styles.toggle, draft.use_location ? styles.toggleOn : styles.toggleOff]}
              >
                <Ionicons
                  name={draft.use_location ? "checkbox" : "square-outline"}
                  size={20}
                  color={draft.use_location ? colors.onBrand : colors.onSurface}
                />
                <Text style={[styles.toggleText, draft.use_location && { color: colors.onBrand }]}>
                  POUZE AKCE V OKOLÍ
                </Text>
              </Pressable>
              {draft.use_location && (
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" }}>
                  {[2, 5, 10, 20].map((km) => {
                    const active = draft.radius_km === km;
                    return (
                      <Pressable
                        key={km}
                        testID={`filter-radius-${km}`}
                        onPress={() => set("radius_km", km)}
                        style={[
                          styles.smallChip,
                          active ? styles.smallChipActive : styles.smallChipInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallChipText,
                            active ? styles.smallChipTextActive : styles.smallChipTextInactive,
                          ]}
                        >
                          {km} KM
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Section>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            testID="filter-reset"
            style={styles.resetBtn}
            onPress={reset}
          >
            <Text style={styles.resetText}>VYNULOVAT</Text>
          </Pressable>
          <Pressable
            testID="filter-apply"
            style={styles.applyBtn}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text style={styles.applyText}>POUŽÍT FILTRY →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chips({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: { id: string; label: string }[];
  value?: string;
  onChange: (id: string) => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            testID={`${testIDPrefix}-${o.id}`}
            onPress={() => onChange(o.id)}
            style={[styles.smallChip, active ? styles.smallChipActive : styles.smallChipInactive]}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
  },
  title: { flex: 1, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, color: colors.onSurface },
  closeBtn: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: "Courier",
  },
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
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  toggleOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  toggleOff: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.onSurface,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
  },
  resetText: { fontWeight: "800", letterSpacing: 1.2, color: colors.onSurface },
  applyBtn: {
    flex: 1.6,
    paddingVertical: 16,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  applyText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5 },
});
