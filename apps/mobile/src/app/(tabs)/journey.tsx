import { apptStatusLabel, formatDate, formatDateTime } from "@skinsense/shared";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { fetchAllPlans, fetchAppointments } from "@/lib/queries";
import { useQuery } from "@/lib/useQuery";
import { Card, Empty, ErrorNote, Loading, Screen, ScreenHeader, Section } from "@/ui/components";
import { Icon } from "@/ui/Icon";
import { ProgressRing } from "@/ui/ProgressRing";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

export default function Journey() {
  const plans = useQuery(fetchAllPlans);
  const appts = useQuery(fetchAppointments);

  return (
    <Screen>
      <ScreenHeader title="Your journey" />

      <Section title="Treatment courses">
        {plans.loading ? <Loading /> : null}
        {plans.error ? <ErrorNote message={plans.error} onRetry={plans.reload} /> : null}
        {plans.data?.length === 0 ? (
          <Empty title="No courses yet" body="After your consultation, your doctor’s treatment plan will appear here." />
        ) : null}
        {plans.data?.map((p) => (
          <Card key={p.id} style={{ gap: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
              <ProgressRing done={p.progress.done} total={p.progress.total} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="bodyStrong">{p.protocols?.name}</Text>
                <Text variant="caption">
                  Started {formatDate(p.started_on, { weekday: undefined, year: "numeric" })} · {p.status}
                </Text>
              </View>
            </View>
            <View style={{ gap: space.sm }}>
              {[...(p.plan_sessions ?? [])]
                .sort((a, b) => a.seq - b.seq)
                .map((s) => (
                  <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: s.performed_at ? colors.plum : colors.lilac,
                      }}
                    >
                      {s.performed_at ? (
                        <Icon name="check" size={12} color={colors.white} strokeWidth={2.4} />
                      ) : (
                        <Text style={{ fontSize: 10, color: colors.plum }}>{s.seq}</Text>
                      )}
                    </View>
                    <Text variant="caption" style={{ flex: 1, color: colors.ink }}>
                      Session {s.seq}
                      {s.photo_required ? " · photos" : ""}
                    </Text>
                    <Text variant="caption">
                      {s.performed_at
                        ? `Done ${formatDate(s.performed_at, { weekday: undefined })}`
                        : `Due ${formatDate(s.due_from, { weekday: undefined })}`}
                    </Text>
                  </View>
                ))}
            </View>
          </Card>
        ))}
      </Section>

      <Section title="Visits">
        {appts.loading ? <Loading /> : null}
        {appts.error ? <ErrorNote message={appts.error} onRetry={appts.reload} /> : null}
        {appts.data?.length === 0 ? <Empty title="No visits yet" /> : null}
        {appts.data?.map((a) => (
          <Pressable key={a.id} onPress={() => router.push(`/appointments/${a.id}`)} accessibilityRole="button">
            <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="bodyStrong">{a.services?.name ?? "Consultation"}</Text>
                <Text variant="caption">{formatDateTime(a.starts_at)}</Text>
              </View>
              <Text variant="eyebrow">{apptStatusLabel[a.status]}</Text>
            </Card>
          </Pressable>
        ))}
      </Section>
    </Screen>
  );
}
