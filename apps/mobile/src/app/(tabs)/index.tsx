import { clinic, formatDate, formatTime, greeting, type RxItem } from "@skinsense/shared";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { fetchActivePlans, fetchLatestRegimen, fetchNextAppointment, fetchServices } from "@/lib/queries";
import { loadTicks, saveTicks } from "@/lib/regimen";
import { useSession } from "@/lib/session";
import { useQuery } from "@/lib/useQuery";
import { Card, Screen, Section } from "@/ui/components";
import { Icon, type IconName } from "@/ui/Icon";
import { ProgressRing } from "@/ui/ProgressRing";
import { Text } from "@/ui/Text";
import { colors, font, radii, space } from "@/ui/theme";

export default function Home() {
  const { patient } = useSession();
  const firstName = patient?.full_name.split(" ")[0] ?? "";

  const next = useQuery(fetchNextAppointment);
  const plans = useQuery(fetchActivePlans);
  const regimen = useQuery(fetchLatestRegimen);
  const services = useQuery(fetchServices);

  const plan = plans.data?.[0];

  return (
    <Screen>
      <Header />

      <View style={{ paddingHorizontal: space.xxl, paddingTop: 18, gap: 6 }}>
        <Text variant="caption" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
          {greeting()}
        </Text>
        <Text variant="display">
          {firstName ? `${firstName}, ` : ""}
          <Text style={{ fontFamily: font.displayItalic, color: colors.goldText }}>welcome back.</Text>
        </Text>
      </View>

      {/* Next visit */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.xl }}>
        {next.data ? (
          <Pressable onPress={() => router.push(`/appointments/${next.data!.id}`)} accessibilityRole="button" style={st.hero}>
            <Text style={st.heroMonogram}>S</Text>
            <View style={{ gap: space.lg }}>
              <View style={st.rowBetween}>
                <Text variant="eyebrow" style={{ color: "#E2C79A" }}>
                  Next visit
                </Text>
                <View style={st.pill}>
                  <Text style={{ fontSize: 11, color: colors.champagne, fontFamily: font.body }}>
                    {next.data.status === "arrived" ? "Checked in" : "Confirmed"}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: font.display, fontSize: 30, color: colors.white, lineHeight: 32 }}>
                  {formatDate(next.data.starts_at)} · {formatTime(next.data.starts_at)}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 13, color: "#EAD3E3" }}>
                  {next.data.services?.name ?? "Consultation"}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.plumLine }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <View style={st.avatar}>
                  <Text style={{ fontFamily: font.displaySemi, fontSize: 18, color: colors.plumDeep }}>
                    {initials(next.data.doctor?.full_name ?? clinic.doctor)}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.bodyMedium, fontSize: 13, color: colors.white }}>
                    {next.data.doctor?.full_name ?? clinic.doctor}
                  </Text>
                  <Text style={{ fontFamily: font.body, fontSize: 11, color: "#D9BFD2" }}>
                    {next.data.doctor?.qualification ?? "Dermatologist"}
                  </Text>
                </View>
                <View style={st.goldBtn}>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: "#2A0823" }}>Details</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push("/book")} accessibilityRole="button" style={st.hero}>
            <Text style={st.heroMonogram}>S</Text>
            <View style={{ gap: space.md }}>
              <Text variant="eyebrow" style={{ color: "#E2C79A" }}>
                No upcoming visit
              </Text>
              <Text style={{ fontFamily: font.display, fontSize: 28, color: colors.white, lineHeight: 30 }}>
                Book a consultation with {clinic.doctor}
              </Text>
              <View style={[st.goldBtn, { alignSelf: "flex-start" }]}>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: "#2A0823" }}>Book now</Text>
              </View>
            </View>
          </Pressable>
        )}
      </View>

      {/* Quick actions */}
      <View style={st.quickRow}>
        <Quick icon="calendar" label="Book" onPress={() => router.push("/book")} />
        <Quick icon="phone" label="Call clinic" onPress={() => Linking.openURL(`tel:${clinic.phones[0].replace(/\s/g, "")}`)} />
        <Quick icon="rx" label="Prescriptions" onPress={() => router.push("/prescriptions")} />
        <Quick icon="card" label="Payments" onPress={() => router.push("/payments")} />
      </View>

      {/* Skin journey */}
      {plan ? (
        <Section title="Your skin journey" action="View plan" onAction={() => router.push("/journey")}>
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
              <ProgressRing done={plan.progress.done} total={plan.progress.total} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text variant="bodyStrong">{plan.protocols?.name}</Text>
                <Text variant="caption">
                  {plan.progress.next
                    ? `Session ${plan.progress.next.seq} is due ${formatDate(plan.progress.next.due_from, { weekday: undefined })} – ${formatDate(plan.progress.next.due_to, { weekday: undefined })}.`
                    : "All sessions complete — your doctor will review your results."}
                </Text>
              </View>
            </View>
            {plan.progress.next?.photo_required ? (
              <View style={st.softChip}>
                <Text variant="label" style={{ color: colors.plum }}>
                  Progress photos at next visit
                </Text>
              </View>
            ) : null}
          </Card>
        </Section>
      ) : null}

      {/* Regimen from the latest prescription */}
      {regimen.data && regimen.data.items.length ? <Regimen id={regimen.data.id} items={regimen.data.items} /> : null}

      {/* Treatments */}
      {services.data && services.data.length ? (
        <Section title="Signature treatments" action="See all" onAction={() => router.push("/treatments")}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
            {services.data.slice(0, 6).map((sv, i) => (
              <Pressable
                key={sv.id}
                onPress={() => router.push({ pathname: "/book", params: { service: sv.id } })}
                accessibilityRole="button"
                style={[st.tile, TILE_STYLES[i % TILE_STYLES.length].box]}
              >
                <Text variant="eyebrow" style={{ color: TILE_STYLES[i % TILE_STYLES.length].eyebrow }}>
                  {sv.line}
                </Text>
                <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 26, color: TILE_STYLES[i % TILE_STYLES.length].title }}>
                  {sv.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {/* Trust strip */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: 26 }}>
        <View style={st.trust}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="star" size={16} color={colors.gold} />
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: "#6B4A1E" }}>4.8 from 600+ patient reviews</Text>
          </View>
          <Text style={{ fontFamily: font.displayItalic, fontSize: 20, lineHeight: 26, color: colors.plumDeep }}>
            Diagnosis-first, ethical, result-driven dermatology — from India’s 1st Dermapreneur.
          </Text>
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: "#EFE2CC", paddingTop: 14 }}>
            <Stat value="14+" label="years of practice" />
            <Stat value="1.12L+" label="treatments" />
            <Stat value="30+" label="awards" />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Header() {
  return (
    <View style={[st.rowBetween, { paddingHorizontal: space.xxl, paddingTop: space.md }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={st.logo}>
          <Text style={{ fontFamily: font.displaySemi, fontSize: 22, color: colors.champagne }}>S</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: font.displaySemi, fontSize: 20, color: colors.plumDeep }}>{clinic.name}</Text>
          <Text variant="eyebrow" style={{ fontSize: 9 }}>
            Banjara Hills
          </Text>
        </View>
      </View>
      <Pressable accessibilityLabel="Notifications" style={st.roundBtn} onPress={() => router.push("/profile")}>
        <Icon name="bell" size={18} color={colors.plumDeep} />
      </Pressable>
    </View>
  );
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: "center", gap: space.sm }}>
      <View style={st.quickIcon}>
        <Icon name={icon} size={24} />
      </View>
      <Text style={{ fontFamily: font.body, fontSize: 11, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

function Regimen({ id, items }: { id: string; items: RxItem[] }) {
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  useEffect(() => {
    loadTicks(id).then(setTicks);
  }, [id]);
  const toggle = (i: number) => {
    const nextTicks = { ...ticks, [i]: !ticks[i] };
    setTicks(nextTicks);
    void saveTicks(id, nextTicks);
  };
  const done = items.filter((_, i) => ticks[i]).length;

  return (
    <Section title="Today’s regimen" action={`${done} of ${items.length} done`}>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
        {items.map((item, i) => (
          <Pressable
            key={`${item.drug}-${i}`}
            onPress={() => toggle(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!ticks[i] }}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: space.md, minHeight: 56 }}
          >
            {ticks[i] ? (
              <View style={[st.tick, { backgroundColor: colors.plum, borderColor: colors.plum }]}>
                <Icon name="check" size={14} color={colors.white} strokeWidth={2.4} />
              </View>
            ) : (
              <View style={st.tick} />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: font.bodyMedium, fontSize: 13 }}>
                {item.drug}
                {item.strength ? ` ${item.strength}` : ""}
              </Text>
              <Text variant="caption" style={{ fontSize: 11 }}>
                {[item.dose, item.frequency, item.instructions].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <Text variant="eyebrow">Step {i + 1}</Text>
          </Pressable>
        ))}
      </Card>
    </Section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ fontFamily: font.displaySemi, fontSize: 22, color: colors.plumDeep }}>{value}</Text>
      <Text variant="caption" style={{ fontSize: 10 }}>
        {label}
      </Text>
    </View>
  );
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const TILE_STYLES = [
  { box: { backgroundColor: colors.plum }, eyebrow: "#E2C79A", title: colors.white },
  { box: { backgroundColor: colors.champagne }, eyebrow: "#6B4A1E", title: colors.plumDeep },
  { box: { backgroundColor: colors.lilac, borderWidth: 1, borderColor: colors.border }, eyebrow: colors.plum, title: colors.plumDeep },
  { box: { backgroundColor: colors.plumDeep }, eyebrow: "#E2C79A", title: colors.white },
];

const st = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { overflow: "hidden", backgroundColor: colors.plumDeep, borderRadius: radii.lg, padding: 22 },
  heroMonogram: {
    position: "absolute",
    right: -18,
    top: -50,
    fontFamily: font.displayItalic,
    fontSize: 220,
    color: "#5C1A50",
  },
  pill: { borderWidth: 1, borderColor: colors.goldText, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 5 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.champagne,
    alignItems: "center",
    justifyContent: "center",
  },
  goldBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: { flexDirection: "row", gap: 10, paddingHorizontal: space.xl, paddingTop: 22 },
  quickIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  softChip: { alignSelf: "flex-start", backgroundColor: colors.lilac, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tick: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#CDB1C6", alignItems: "center", justifyContent: "center" },
  tile: { width: 150, height: 188, borderRadius: radii.md, padding: space.lg, justifyContent: "space-between" },
  trust: { borderWidth: 1, borderColor: "#DCC3A0", borderRadius: radii.md + 2, padding: space.xl, backgroundColor: colors.cream, gap: 14 },
});
