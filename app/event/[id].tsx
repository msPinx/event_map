import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  spacing,
  eventTypeLabel,
  formatDate,
  languageLabel,
} from "@/src/theme";
import {
  getEvent,
  addFavorite,
  removeFavorite,
  addAttending,
  removeAttending,
  submitRating,
  listEventRatings,
  type Event,
  type Rating,
} from "@/src/api";
import { SingleLocationMap } from "@/src/components/MapViews";
import { useAuth } from "@/src/auth";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, token, refresh } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const isFavorite = !!user?.favorites?.includes(id ?? "");
  const isAttending = !!user?.attending?.includes(id ?? "");
  const isPast = event ? event.date < new Date().toISOString().slice(0, 10) : false;

  const load = useCallback(async () => {
    if (!id) return;
    const [e, r] = await Promise.all([getEvent(id), listEventRatings(id)]);
    setEvent(e);
    setRatings(r);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const toggleFavorite = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      if (isFavorite) await removeFavorite(token, id!);
      else await addFavorite(token, id!);
      await refresh();
    } catch {}
  };

  const toggleAttending = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      if (isAttending) await removeAttending(token, id!);
      else await addAttending(token, id!);
      await refresh();
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} testID="event-detail-loading">
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} testID="event-detail-error">
        <Text style={styles.errorText}>UDÁLOST NENALEZENA</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} testID="event-detail-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: event.image_url }} style={styles.heroImage} contentFit="cover" />
          <SafeAreaView edges={["top"]} style={styles.topBar}>
            <Pressable testID="event-back-btn" style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable testID="event-fav-btn" style={styles.iconBtn} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? colors.brand : colors.onSurface}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eventTypeLabel(event.event_type).toUpperCase()}</Text>
            </View>
            {event.for_children && (
              <View style={[styles.badge, styles.kidsBadge]}>
                <Text style={[styles.badgeText, { color: colors.onBrand }]}>PRO DĚTI</Text>
              </View>
            )}
            <View style={[styles.badge, styles.langBadge]}>
              <Text style={styles.badgeText}>{languageLabel(event.language).toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.title} testID="event-title">{event.title}</Text>

          <View style={styles.divider} />

          <View style={styles.metaBlock}>
            <MetaRow label="DATUM" value={`${formatDate(event.date)} · ${event.time}`} />
            <MetaRow label="MÍSTO" value={event.venue} />
            <MetaRow label="ADRESA" value={event.address} />
            {event.author ? <MetaRow label="AUTOR" value={event.author} /> : null}
            {event.publisher ? <MetaRow label="NAKLAD." value={event.publisher} /> : null}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>O UDÁLOSTI</Text>
          <Text style={styles.description}>{event.description}</Text>

          {event.program.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>PROGRAM</Text>
              <View style={styles.programList}>
                {event.program.map((p, i) => (
                  <View key={i} style={styles.programRow} testID={`program-${i}`}>
                    <Text style={styles.programTime}>{p.time}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.programTitle}>{p.title}</Text>
                      {p.speaker ? <Text style={styles.programSpeaker}>{p.speaker}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {event.links.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>DALŠÍ ODKAZY</Text>
              <View style={{ gap: spacing.sm }}>
                {event.links.map((l, i) => (
                  <Pressable
                    key={i}
                    testID={`link-${i}`}
                    style={styles.linkRow}
                    onPress={() => Linking.openURL(l.url)}
                  >
                    <Ionicons name="link-outline" size={16} color={colors.onSurface} />
                    <Text style={styles.linkText} numberOfLines={1}>{l.label}</Text>
                    <Ionicons name="open-outline" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>
            {event.organizer_names.length > 1 ? "POŘÁDAJÍ" : "POŘÁDÁ"}
          </Text>
          <View style={{ gap: spacing.sm }}>
            {event.organizer_ids.map((oid, i) => (
              <Pressable
                key={oid}
                testID={`event-org-${oid}`}
                style={styles.organizerBlock}
                onPress={() => router.push(`/organizer/${oid}`)}
              >
                <View style={styles.organizerSquare} />
                <Text style={styles.organizerName} numberOfLines={1}>
                  {event.organizer_names[i] || "?"}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.onSurface} />
              </Pressable>
            ))}
          </View>

          {event.book_url ? (
            <Pressable
              testID="event-book-btn"
              style={styles.bookBtn}
              onPress={() => Linking.openURL(event.book_url!)}
            >
              <Ionicons name="book-outline" size={18} color={colors.onSurfaceInverse} />
              <Text style={styles.bookBtnText}>KOUPIT KNIHU →</Text>
            </Pressable>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>LOKACE</Text>
          <View style={styles.mapBox}>
            <SingleLocationMap latitude={event.latitude} longitude={event.longitude} />
          </View>

          {isPast && (
            <>
              <View style={styles.divider} />
              <RatingSection eventId={event.id} onSubmitted={load} ratings={ratings} />
            </>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.ctaWrap}>
        <View style={styles.ctaRow}>
          <Pressable
            testID="event-attend-btn"
            style={[styles.ctaSecondary, isAttending && styles.ctaSecondaryActive]}
            onPress={toggleAttending}
          >
            <Ionicons
              name={isAttending ? "checkmark-circle" : "calendar-outline"}
              size={18}
              color={isAttending ? colors.onBrand : colors.onSurface}
            />
            <Text style={[styles.ctaSecondaryText, isAttending && { color: colors.onBrand }]}>
              {isAttending ? "ZÚČASTNÍM SE" : "ZÚČASTNIT SE"}
            </Text>
          </Pressable>
          {event.ticket_url ? (
            <Pressable
              testID="event-ticket-btn"
              style={styles.ctaPrimary}
              onPress={() => Linking.openURL(event.ticket_url!)}
            >
              <Text style={styles.ctaPrimaryText}>VSTUPENKY →</Text>
            </Pressable>
          ) : (
            <Pressable
              testID="event-info-btn"
              style={styles.ctaPrimary}
              onPress={() => router.push(`/organizer/${event.organizer_ids[0]}`)}
            >
              <Text style={styles.ctaPrimaryText}>VÍCE INFO →</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function RatingSection({
  eventId,
  onSubmitted,
  ratings,
}: {
  eventId: string;
  onSubmitted: () => Promise<void>;
  ratings: Rating[];
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stars, setStars] = useState<number>(0);
  const [wouldGo, setWouldGo] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const myRating = ratings.find((r) => r.user_id === user?.user_id);

  useEffect(() => {
    if (myRating) {
      setStars(myRating.rating);
      setWouldGo(myRating.would_go_again);
      setComment(myRating.comment ?? "");
    }
  }, [myRating]);

  const submit = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (stars < 1) {
      setErr("Vyber počet hvězd");
      return;
    }
    if (wouldGo === null) {
      setErr("Odpověz, jestli bys šel/šla znova");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await submitRating(token, eventId, {
        rating: stars,
        would_go_again: wouldGo,
        comment: comment.trim() || undefined,
      });
      await onSubmitted();
    } catch (e: any) {
      setErr(e?.message ?? "Uložení selhalo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }} testID="rating-section">
      <Text style={styles.sectionLabel}>HODNOCENÍ AKCE</Text>

      {!token ? (
        <Pressable
          testID="rating-login-cta"
          style={styles.loginCta}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginCtaText}>PŘIHLÁS SE PRO HODNOCENÍ →</Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.qLabel}>Jak se ti akce líbila?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                testID={`star-${n}`}
                onPress={() => setStars(n)}
                style={styles.starBtn}
              >
                <Ionicons
                  name={stars >= n ? "star" : "star-outline"}
                  size={28}
                  color={stars >= n ? colors.brand : colors.onSurface}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.qLabel}>Šel/Šla bys znova?</Text>
          <View style={styles.yesNoRow}>
            <Pressable
              testID="would-yes"
              style={[styles.yesNo, wouldGo === true && styles.yesNoActive]}
              onPress={() => setWouldGo(true)}
            >
              <Text style={[styles.yesNoText, wouldGo === true && { color: colors.onBrand }]}>
                ANO
              </Text>
            </Pressable>
            <Pressable
              testID="would-no"
              style={[styles.yesNo, wouldGo === false && styles.yesNoActiveDark]}
              onPress={() => setWouldGo(false)}
            >
              <Text style={[styles.yesNoText, wouldGo === false && { color: colors.onSurfaceInverse }]}>
                NE
              </Text>
            </Pressable>
          </View>

          <Text style={styles.qLabel}>Co se ti líbilo / nelíbilo? (volitelné)</Text>
          <TextInput
            testID="rating-comment"
            value={comment}
            onChangeText={setComment}
            placeholder="Napiš svůj dojem..."
            placeholderTextColor={colors.muted}
            style={styles.textarea}
            multiline
          />

          {err && (
            <View style={styles.errorBlock} testID="rating-error">
              <Text style={styles.errorBlockText}>{err}</Text>
            </View>
          )}

          <Pressable
            testID="rating-submit"
            style={styles.submitBtn}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.submitText}>
              {saving ? "UKLÁDÁM…" : myRating ? "AKTUALIZOVAT HODNOCENÍ →" : "ODESLAT HODNOCENÍ →"}
            </Text>
          </Pressable>
        </>
      )}

      {ratings.length > 0 && (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Text style={styles.sectionLabel}>OSTATNÍ HODNOCENÍ · {ratings.length}</Text>
          {ratings.slice(0, 5).map((r) => (
            <View key={r.id} style={styles.otherRating} testID={`rating-item-${r.id}`}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={r.rating >= n ? "star" : "star-outline"}
                    size={14}
                    color={r.rating >= n ? colors.brand : colors.muted}
                  />
                ))}
                <Text style={styles.ratingMeta}>
                  · {r.would_go_again ? "Šel/Šla znova" : "Nešel/Nešla znova"}
                </Text>
              </View>
              {r.comment ? <Text style={styles.ratingComment}>{`„${r.comment}"`}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  heroWrap: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.surfaceSecondary },
  heroImage: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.lg, gap: spacing.md },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  kidsBadge: { backgroundColor: colors.brand, borderColor: colors.brand },
  langBadge: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: colors.onSurface, fontFamily: "Courier" },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -1.2,
    lineHeight: 34,
  },
  divider: { height: 1.5, backgroundColor: colors.borderStrong, marginVertical: spacing.sm },
  metaBlock: { gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  metaLabel: {
    width: 70,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.muted,
    fontFamily: "Courier",
    paddingTop: 2,
  },
  metaValue: { flex: 1, fontSize: 14, color: colors.onSurface, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.muted,
    fontFamily: "Courier",
    marginBottom: 4,
  },
  description: { fontSize: 15, color: colors.onSurface, lineHeight: 22 },
  programList: { gap: spacing.sm },
  programRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTertiary,
  },
  programTime: {
    width: 56,
    fontFamily: "Courier",
    fontWeight: "800",
    color: colors.brand,
    fontSize: 13,
  },
  programTitle: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  programSpeaker: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  linkText: { flex: 1, fontSize: 14, color: colors.onSurface, fontWeight: "700" },
  organizerBlock: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  organizerSquare: { width: 28, height: 28, backgroundColor: colors.brand },
  organizerName: { flex: 1, fontSize: 14, fontWeight: "800", color: colors.onSurface },
  bookBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceInverse,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  bookBtnText: { color: colors.onSurfaceInverse, fontWeight: "900", letterSpacing: 1.2 },
  mapBox: {
    width: "100%",
    height: 180,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
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
  ctaRow: { flexDirection: "row", margin: spacing.lg, gap: spacing.sm },
  ctaSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ctaSecondaryActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  ctaSecondaryText: { fontWeight: "800", letterSpacing: 1, color: colors.onSurface, fontSize: 12 },
  ctaPrimary: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.surfaceInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimaryText: { color: colors.onSurfaceInverse, fontWeight: "900", letterSpacing: 1.2, fontSize: 13 },
  errorText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1.5,
    fontFamily: "Courier",
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
  loginCta: {
    backgroundColor: colors.surfaceInverse,
    padding: spacing.md,
    alignItems: "center",
  },
  loginCtaText: { color: colors.onSurfaceInverse, fontWeight: "900", letterSpacing: 1.2 },
  qLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  starsRow: { flexDirection: "row", gap: spacing.sm },
  starBtn: { padding: 4 },
  yesNoRow: { flexDirection: "row", gap: spacing.sm },
  yesNo: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
  },
  yesNoActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  yesNoActiveDark: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  yesNoText: { fontWeight: "900", letterSpacing: 1.5, color: colors.onSurface },
  textarea: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    color: colors.onSurface,
  },
  errorBlock: { backgroundColor: colors.brand, padding: spacing.md },
  errorBlockText: { color: colors.onBrand, fontWeight: "800", fontSize: 12 },
  submitBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: colors.onBrand, fontWeight: "900", letterSpacing: 1.5 },
  otherRating: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: 6,
  },
  ratingMeta: { fontSize: 11, fontWeight: "700", color: colors.muted, marginLeft: 4 },
  ratingComment: { fontSize: 13, color: colors.onSurface, fontStyle: "italic" },
});
