import { formatDate, type RxItem } from "@skinsense/shared";
import { router } from "expo-router";
import { View } from "react-native";

import { fetchPrescriptions } from "@/lib/queries";
import { useQuery } from "@/lib/useQuery";
import { Card, Empty, ErrorNote, Loading, Screen, ScreenHeader } from "@/ui/components";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

export default function Prescriptions() {
  const { data, error, loading, reload } = useQuery(fetchPrescriptions);

  return (
    <Screen>
      <ScreenHeader title="Prescriptions" onBack={() => router.back()} />
      <View style={{ padding: space.xl, gap: space.md }}>
        {loading ? <Loading /> : null}
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}
        {data?.length === 0 ? <Empty title="No prescriptions yet" body="Prescriptions signed by your doctor appear here." /> : null}
        {data?.map((rx) => {
          const items = (Array.isArray(rx.items) ? rx.items : []) as unknown as RxItem[];
          const expired = rx.valid_to ? new Date(rx.valid_to) < new Date() : false;
          return (
            <Card key={rx.id} style={{ gap: space.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="eyebrow">{rx.telemedicine ? "Tele-consult" : "In clinic"}</Text>
                <Text variant="caption" style={{ color: expired ? colors.muted : colors.success }}>
                  {expired ? "Expired" : rx.valid_to ? `Valid till ${formatDate(rx.valid_to, { weekday: undefined })}` : "Active"}
                </Text>
              </View>
              <Text variant="heading">{formatDate(rx.signed_at, { year: "numeric" })}</Text>
              {items.map((it, i) => (
                <View key={i} style={{ gap: 2, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, paddingTop: i ? space.sm : 0 }}>
                  <Text variant="bodyStrong">
                    {it.drug} {it.strength ?? ""}
                  </Text>
                  <Text variant="caption">{[it.dose, it.frequency, it.duration].filter(Boolean).join(" · ")}</Text>
                  {it.instructions ? <Text variant="caption">{it.instructions}</Text> : null}
                </View>
              ))}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
