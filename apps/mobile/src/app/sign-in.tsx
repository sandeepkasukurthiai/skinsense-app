import { toE164India } from "@skinsense/shared";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { Button } from "@/ui/components";
import { Text } from "@/ui/Text";
import { colors, font, radii, space } from "@/ui/theme";

/** Phone + OTP sign-in (Supabase Auth, SMS provider configured in the Supabase dashboard). */
export default function SignIn() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const e164 = toE164India(phone);
    if (!e164) return setError("Enter a 10-digit mobile number.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (error) return setError(error.message);
    setSentTo(e164);
  }

  async function verify() {
    if (!sentTo) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone: sentTo, token: code.trim(), type: "sms" });
    setBusy(false);
    if (error) setError(error.message);
    // On success the session listener routes to onboarding or home.
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.plumDeep }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={st.hero}>
          <View style={st.mark}>
            <Text style={{ fontFamily: font.displaySemi, fontSize: 34, color: colors.champagne }}>S</Text>
          </View>
          <Text style={{ fontFamily: font.display, fontSize: 40, color: colors.white, textAlign: "center" }}>
            The Skin Sensé
          </Text>
          <Text variant="eyebrow" style={{ color: "#E2C79A" }}>
            Banjara Hills · Hyderabad
          </Text>
          <Text style={{ fontFamily: font.displayItalic, fontSize: 20, color: "#EAD3E3", textAlign: "center" }}>
            Diagnosis-first dermatology, in your pocket.
          </Text>
        </View>

        <View style={st.sheet}>
          {!sentTo ? (
            <>
              <Text variant="heading">Sign in with your mobile</Text>
              <Text variant="caption">We’ll send a one-time code by SMS. Use the number registered at the clinic.</Text>
              <View style={st.inputRow}>
                <Text variant="bodyStrong" style={{ color: colors.muted }}>
                  +91
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  placeholderTextColor="#A893A3"
                  accessibilityLabel="Mobile number"
                  style={st.input}
                  maxLength={14}
                />
              </View>
              <Button label="Send code" onPress={sendCode} loading={busy} />
            </>
          ) : (
            <>
              <Text variant="heading">Enter the 6-digit code</Text>
              <Text variant="caption">Sent to {sentTo}</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                accessibilityLabel="One-time code"
                style={[st.inputRow, st.input, { letterSpacing: 8, textAlign: "center", fontSize: 22 }]}
              />
              <Button label="Verify & continue" onPress={verify} loading={busy} disabled={code.length < 6} />
              <Button label="Use a different number" variant="ghost" onPress={() => setSentTo(null)} />
            </>
          )}
          {error ? (
            <Text variant="caption" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, paddingHorizontal: space.xxl },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.plum,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  sheet: {
    backgroundColor: colors.blush,
    borderTopLeftRadius: radii.lg + 4,
    borderTopRightRadius: radii.lg + 4,
    padding: space.xxl,
    paddingBottom: 40,
    gap: space.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: space.lg,
    minHeight: 56,
  },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 17, color: colors.ink },
});
