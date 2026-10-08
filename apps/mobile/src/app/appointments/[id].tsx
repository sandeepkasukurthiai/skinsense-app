import { apptStatusLabel, clinic, formatDate, formatTime } from "@skinsense/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Linking, View } from "react-native";

import { fetchClinician } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@/lib/useQuery";
import { Button, Card, ErrorNote, Loading, Screen, ScreenHeader } from "@/ui/components";
import { Text } from "@/ui/Text";
import { space } from "@/ui/theme";

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);

  const q = useQuery(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, provider_id, services(name, duration_min)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { ...data, doctor: await fetchClinician(data.provider_id) };
  }, [id]);

  function cancel() {
    Alert.alert("Cancel this visit?", "You can book a new time any time.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel visit",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          // RLS lets a patient move their own booked appointment to cancelled only.
          const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
          setBusy(false);
          if (error) Alert.alert("Couldn’t cancel", error.message);
          else q.reload();
        },
      },
    ]);
  }

  const a = q.data;
  const upcoming = a && a.status === "booked" && new Date(a.starts_at) > new Date();

  return (
    <Screen>
      <ScreenHeader title="Visit" onBack={() => router.back()} />
      <View style={{ padding: space.xl, gap: space.lg }}>
        {q.loading && !a ? <Loading /> : null}
        {q.error ? <ErrorNote message={q.error} onRetry={q.reload} /> : null}
        {a ? (
          <>
            <Card style={{ gap: space.md }}>
              <Text variant="eyebrow">{apptStatusLabel[a.status]}</Text>
              <Text variant="title">{a.services?.name ?? "Consultation"}</Text>
              <Text variant="bodyStrong">
                {formatDate(a.starts_at, { year: "numeric" })} · {formatTime(a.starts_at)} – {formatTime(a.ends_at)}
              </Text>
              <Text variant="body">with {a.doctor?.full_name ?? clinic.doctor}</Text>
            </Card>
            <Card style={{ gap: space.sm }}>
              <Text variant="eyebrow">Where</Text>
              <Text variant="body">{clinic.address}</Text>
              <Text variant="caption">Please arrive 10 minutes early with a clean face (no make-up) for skin procedures.</Text>
            </Card>
            <Button
              label="Get directions"
              variant="ghost"
              icon="pin"
              onPress={() => Linking.openURL("https://maps.google.com/?q=The+Skin+Sense+Banjara+Hills+Hyderabad")}
            />
            {upcoming ? <Button label="Cancel visit" variant="ghost" onPress={cancel} loading={busy} /> : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
