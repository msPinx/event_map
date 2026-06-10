import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/src/theme";
import { getCalendar, type Event } from "@/src/api";
import EventCard from "@/src/components/EventCard";

const MONTHS = [
  "LEDEN", "ÚNOR", "BŘEZEN", "DUBEN", "KVĚTEN", "ČERVEN",
  "ČERVENEC", "SRPEN", "ZÁŘÍ", "ŘÍJEN", "LISTOPAD", "PROSINEC",
];
const WEEK_LABELS = ["P", "Ú", "S", "Č", "P", "S", "N"];

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function firstWeekday(y: number, m: number) {
  // Monday=0..Sunday=6
  const jsDay = new Date(y, m - 1, 1).getDay(); // 0 Sun ... 6 Sat
  return (jsDay + 6) % 7;
}
function isoDate(y: number, m: number, d: number) {
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    getCalendar(year, month)
      .then((data) => {
        setCounts(data.counts || {});
        setEvents(data.events || []);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const grid = useMemo(() => {
    const total = daysInMonth(year, month);
    const offset = firstWeekday(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const selectedEvents = selected ? events.filter((e) => e.date === selected) : events;

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };
  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const todayIso = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="calendar-screen">
      <View style={styles.header}>
        <Pressable testID="cal-prev" style={styles.navBtn} onPress={prevMonth}>
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerSub}>KALENDÁŘ</Text>
          <Text style={styles.headerTitle}>
            {MONTHS[month - 1]} {year}
          </Text>
        </View>
        <Pressable testID="cal-next" style={styles.navBtn} onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_LABELS.map((w, i) => (
          <Text
            key={i}
            style={[styles.weekLabel, (i === 5 || i === 6) && { color: colors.brand }]}
          >
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid} testID="cal-grid">
        {grid.map((d, idx) => {
          if (d === null) {
            return <View key={idx} style={styles.cell} />;
          }
          const iso = isoDate(year, month, d);
          const count = counts[iso] || 0;
          const isToday = iso === todayIso;
          const isSelected = iso === selected;
          return (
            <Pressable
              key={idx}
              testID={`cal-cell-${iso}`}
              style={[
                styles.cell,
                count > 0 && styles.cellHasEvents,
                isToday && styles.cellToday,
                isSelected && styles.cellSelected,
              ]}
              onPress={() => setSelected(isSelected ? null : iso)}
              disabled={count === 0}
            >
              <Text
                style={[
                  styles.cellDay,
                  isSelected && { color: colors.onBrand },
                  isToday && !isSelected && { color: colors.brand },
                  count === 0 && { color: colors.muted },
                ]}
              >
                {d}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.dot,
                    isSelected && { backgroundColor: colors.onBrand },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {selected ? `AKCE ${selected.split("-").reverse().join(".")}` : `${events.length} AKCÍ V MĚSÍCI`}
        </Text>
        {selected && (
          <Pressable
            testID="cal-clear-sel"
            style={styles.clearBtn}
            onPress={() => setSelected(null)}
          >
            <Text style={styles.clearText}>ZRUŠIT</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          {selectedEvents.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>Žádné akce.</Text>
            </View>
          ) : (
            selectedEvents.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
  navBtn: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.brand,
    fontFamily: "Courier",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.onSurface,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: "Courier",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.surfaceTertiary,
  },
  cellHasEvents: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  cellToday: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  cellSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  cellDay: { fontSize: 14, fontWeight: "800", color: colors.onSurface },
  dot: {
    width: 5,
    height: 5,
    backgroundColor: colors.brand,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderStrong,
  },
  listHeaderText: {
    flex: 1,
    color: colors.onSurfaceInverse,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: "Courier",
    fontSize: 12,
  },
  clearBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  clearText: { color: colors.onBrand, fontWeight: "800", letterSpacing: 1, fontSize: 11 },
  center: { padding: spacing.xl, alignItems: "center" },
  emptyBlock: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 13 },
});
