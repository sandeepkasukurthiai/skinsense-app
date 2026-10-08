import { formatINR, serviceLineLabel, type ServiceLine } from "@skinsense/shared";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { fetchServices } from "@/lib/queries";
import { useQuery } from "@/lib/useQuery";
import { Card, Chip, Empty, ErrorNote, Loading, Screen, ScreenHeader } from "@/ui/components";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

export default function Treatments() {
  const { data, error, loading, reload } = useQuery(fetchServices);
  const [line, setLine] = useState<ServiceLine | "all">("all");

  const lines = useMemo(() => Array.from(new Set((data ?? []).map((s) => s.line))), [data]);
  const shown = (data ?? []).filter((s) => line === "all" || s.line === line);

  return (
    <Screen>
      <ScreenHeader title="Treatments" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.lg }}>
        <Chip label="All" active={line === "all"} onPress={() => setLine("all")} />
        {lines.map((l) => (
          <Chip key={l} label={serviceLineLabel[l]} active={line === l} onPress={() => setLine(l)} />
        ))}
      </ScrollView>

      <View style={{ padding: space.xl, gap: space.md }}>
        {loading ? <Loading /> : null}
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}
        {!loading && !error && shown.length === 0 ? <Empty title="No treatments listed yet" /> : null}
        {shown.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/book", params: { service: s.id } })}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="eyebrow">{serviceLineLabel[s.line]}</Text>
                <Text variant="heading">{s.name}</Text>
                <Text variant="caption">
                  {s.duration_min} min{s.list_price_paise ? ` · from ${formatINR(s.list_price_paise)}` : ""}
                </Text>
              </View>
              <Icon name="chevron" color={colors.muted} />
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
