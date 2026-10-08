import type { Patient } from "@skinsense/shared";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, Chip, Screen } from "@/ui/components";
import { Text } from "@/ui/Text";
import { colors, font, radii, space } from "@/ui/theme";

const CONCERNS = ["Acne", "Pigmentation", "Hair fall", "Scars", "Anti-ageing", "Something else"];

/** Shown when this phone number has no clinic record yet: creates the patient profile. */
export default function Onboarding() {
  const { refreshPatient, signOut } = useSession();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [concern, setConcern] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return setError("Date of birth should look like 1995-08-21.");
    setBusy(true);
    setError(null);
    try {
      await api<{ patient: Patient }>("/api/patient/claim", {
        method: "POST",
        body: { full_name: name.trim(), dob: dob || null, presenting_concern: concern },
      });
      await refreshPatient();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ padding: space.xxl, gap: space.xl, paddingTop: 48 }}>
        <Text variant="eyebrow">Welcome</Text>
        <Text variant="display">
          Let’s set up your <Text style={{ fontFamily: font.displayItalic, color: colors.goldText }}>skin profile.</Text>
        </Text>
        <Text variant="caption">This helps Dr. Alekya’s team prepare for your first visit.</Text>

        <View style={{ gap: space.sm }}>
          <Text variant="label">Full name</Text>
          <TextInput value={name} onChangeText={setName} style={st.input} autoComplete="name" accessibilityLabel="Full name" />
        </View>
        <View style={{ gap: space.sm }}>
          <Text variant="label">Date of birth (optional)</Text>
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A893A3"
            style={st.input}
            accessibilityLabel="Date of birth"
          />
        </View>
        <View style={{ gap: space.sm }}>
          <Text variant="label">What brings you in?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {CONCERNS.map((c) => (
              <Chip key={c} label={c} active={concern === c} onPress={() => setConcern(c)} />
            ))}
          </View>
        </View>

        {error ? (
          <Text variant="caption" style={{ color: colors.danger }}>
            {error}
          </Text>
        ) : null}
        <Button label="Continue" onPress={save} loading={busy} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: space.lg,
    minHeight: 52,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
  },
});
