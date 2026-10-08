import { formatDate, formatINR, type InvoiceLine } from "@skinsense/shared";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, View } from "react-native";

import { api } from "@/lib/api";
import { fetchInvoices } from "@/lib/queries";
import { useQuery } from "@/lib/useQuery";
import { Button, Card, Empty, ErrorNote, Loading, Screen, ScreenHeader } from "@/ui/components";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

export default function Payments() {
  const { data, error, loading, reload } = useQuery(fetchInvoices);
  const [paying, setPaying] = useState<string | null>(null);

  async function pay(invoiceId: string) {
    setPaying(invoiceId);
    try {
      // Server creates (or reuses) a Razorpay payment link for this invoice.
      const { url } = await api<{ url: string }>("/api/payments/link", { method: "POST", body: { invoice_id: invoiceId } });
      await WebBrowser.openBrowserAsync(url);
      reload(); // the Razorpay webhook marks it paid; refresh on return
    } catch (e) {
      Alert.alert("Payment unavailable", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPaying(null);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Bills & payments" onBack={() => router.back()} />
      <View style={{ padding: space.xl, gap: space.md }}>
        {loading ? <Loading /> : null}
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}
        {data?.length === 0 ? <Empty title="No bills yet" /> : null}
        {data?.map((inv) => {
          const lines = (Array.isArray(inv.lines) ? inv.lines : []) as unknown as InvoiceLine[];
          return (
            <Card key={inv.id} style={{ gap: space.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text variant="title">{formatINR(inv.amount_paise)}</Text>
                <Text variant="caption" style={{ color: inv.paid_at ? colors.success : colors.warning }}>
                  {inv.paid_at ? `Paid ${formatDate(inv.paid_at, { weekday: undefined })}` : "Due"}
                </Text>
              </View>
              <Text variant="caption">{formatDate(inv.created_at, { year: "numeric" })}</Text>
              {lines.map((l, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="body">
                    {l.label}
                    {l.qty > 1 ? ` × ${l.qty}` : ""}
                  </Text>
                  <Text variant="body">{formatINR(l.qty * l.unit_paise)}</Text>
                </View>
              ))}
              {!inv.paid_at ? <Button label="Pay securely" variant="gold" onPress={() => pay(inv.id)} loading={paying === inv.id} /> : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
