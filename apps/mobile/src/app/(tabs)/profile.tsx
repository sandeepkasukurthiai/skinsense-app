import { clinic, formatDate } from "@skinsense/shared";
import { router } from "expo-router";
import { Linking, Pressable, View } from "react-native";

import { useSession } from "@/lib/session";
import { Button, Card, Screen, ScreenHeader, Section } from "@/ui/components";
import { Icon, type IconName } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { colors, space } from "@/ui/theme";

export default function Profile() {
  const { patient, signOut } = useSession();

  return (
    <Screen>
      <ScreenHeader title="Profile" />

      <View style={{ paddingHorizontal: space.xl, paddingTop: space.lg }}>
        <Card style={{ gap: space.sm }}>
          <Text variant="heading">{patient?.full_name}</Text>
          <Text variant="caption">{patient?.phone}</Text>
          {patient?.dob ? <Text variant="caption">Born {formatDate(patient.dob, { weekday: undefined, year: "numeric" })}</Text> : null}
          {patient?.presenting_concern ? <Text variant="caption">Concern: {patient.presenting_concern}</Text> : null}
        </Card>
      </View>

      <Section title="Records">
        <Card style={{ paddingVertical: 4 }}>
          <Row icon="rx" label="Prescriptions" onPress={() => router.push("/prescriptions")} />
          <Row icon="card" label="Bills & payments" onPress={() => router.push("/payments")} />
          <Row icon="trend" label="Courses & visits" onPress={() => router.push("/journey")} />
        </Card>
      </Section>

      <Section title="The clinic">
        <Card style={{ paddingVertical: 4 }}>
          <Row icon="phone" label={`Call ${clinic.phones[0]}`} onPress={() => Linking.openURL(`tel:${clinic.phones[0].replace(/\s/g, "")}`)} />
          <Row icon="video" label="Chat on WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${clinic.whatsapp.replace("+", "")}`)} />
          <Row
            icon="pin"
            label="Directions — Banjara Hills"
            onPress={() => Linking.openURL("https://maps.google.com/?q=The+Skin+Sense+Banjara+Hills+Hyderabad")}
          />
        </Card>
        <Text variant="caption" style={{ paddingHorizontal: 4 }}>
          {clinic.address} · {clinic.hours}
        </Text>
      </Section>

      <View style={{ padding: space.xl }}>
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

function Row({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52 }}>
      <Icon name={icon} size={20} />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chevron" size={18} color={colors.muted} />
    </Pressable>
  );
}
