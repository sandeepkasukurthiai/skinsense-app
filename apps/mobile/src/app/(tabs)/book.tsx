import { formatINR, formatTime } from "@skinsense/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { api, type Slot } from "@/lib/api";
import { fetchServices } from "@/lib/queries";
import { useQuery } from "@/lib/useQuery";
import { Button, Card, Chip, Empty, ErrorNote, Loading, Screen, ScreenHeader, Section } from "@/ui/components";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

/** Next 14 clinic days (Mon–Sat), as YYYY-MM-DD in IST. */
function upcomingDays() {
  const days: { ymd: string; label: string; sub: string }[] = [];
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(d);
  for (let i = 0; days.length < 14 && i < 21; i++) {
    const d = new Date(Date.now() + i * 86_400_000);
    if (fmt(d, { weekday: "short" }) === "Sun") continue;
    days.push({
      ymd: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d),
      label: i === 0 ? "Today" : fmt(d, { weekday: "short" }),
      sub: fmt(d, { day: "numeric", month: "short" }),
    });
  }
  return days;
}

export default function Book() {
  const params = useLocalSearchParams<{ service?: string }>();
  const services = useQuery(fetchServices);
  const days = useMemo(upcomingDays, []);

  const [serviceId, setServiceId] = useState<string | null>(params.service ?? null);
  const [day, setDay] = useState(days[0]?.ymd);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.service) setServiceId(params.service);
  }, [params.service]);

  useEffect(() => {
    if (!serviceId || !day) return;
    setSlots(null);
    setPicked(null);
    setSlotError(null);
    api<{ slots: Slot[] }>(`/api/patient/slots?service_id=${serviceId}&date=${day}`)
      .then((r) => setSlots(r.slots))
      .catch((e: Error) => setSlotError(e.message));
  }, [serviceId, day]);

  const service = services.data?.find((s) => s.id === serviceId);

  async function confirm() {
    if (!picked || !serviceId) return;
    setBusy(true);
    try {
      const res = await api<{ appointment_id: string }>("/api/patient/book", {
        method: "POST",
        body: { service_id: serviceId, starts_at: picked.starts_at, provider_id: picked.provider_id },
      });
      router.replace(`/appointments/${res.appointment_id}`);
    } catch (e) {
      Alert.alert("Couldn’t book", e instanceof Error ? e.message : "Please try another slot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Book a visit" />

      <Section title="Treatment">
        {services.loading ? (
          <Loading />
        ) : services.error ? (
          <ErrorNote message={services.error} onRetry={services.reload} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {services.data?.map((s) => (
              <Chip key={s.id} label={s.name} active={s.id === serviceId} onPress={() => setServiceId(s.id)} />
            ))}
          </View>
        )}
        {service ? (
          <Text variant="caption">
            {service.duration_min} min{service.list_price_paise ? ` · from ${formatINR(service.list_price_paise)}` : ""}
          </Text>
        ) : null}
      </Section>

      <Section title="Day">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {days.map((d) => (
            <Chip key={d.ymd} label={`${d.label} · ${d.sub}`} active={d.ymd === day} onPress={() => setDay(d.ymd)} />
          ))}
        </ScrollView>
      </Section>

      <Section title="Time">
        {!serviceId ? (
          <Text variant="caption">Choose a treatment to see open times.</Text>
        ) : slotError ? (
          <ErrorNote message={slotError} />
        ) : !slots ? (
          <Loading />
        ) : slots.length === 0 ? (
          <Empty title="Fully booked" body="Try another day, or call the clinic and we’ll fit you in." />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {slots.map((sl) => (
              <Chip
                key={`${sl.provider_id}-${sl.starts_at}`}
                label={formatTime(sl.starts_at)}
                active={picked?.starts_at === sl.starts_at && picked.provider_id === sl.provider_id}
                onPress={() => setPicked(sl)}
              />
            ))}
          </View>
        )}
      </Section>

      {picked && service ? (
        <View style={{ paddingHorizontal: space.xl, paddingTop: space.xxl }}>
          <Card style={{ gap: space.md }}>
            <Text variant="eyebrow">Your booking</Text>
            <Text variant="title">{service.name}</Text>
            <Text variant="body">
              {formatTime(picked.starts_at)} with {picked.provider_name}
            </Text>
            <Text variant="caption" style={{ color: colors.muted }}>
              You’ll get a WhatsApp confirmation. Free cancellation up to the start time.
            </Text>
            <Button label="Confirm booking" onPress={confirm} loading={busy} />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
