import { toE164India } from "@skinsense/shared";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { Text } from "@/ui/Text";
import { colors, font, space } from "@/ui/theme";

type Mode = "phone" | "email";

const noir = "#16050F";
const goldBright = "#D8B77E";

/**
 * Patient sign-in — the app's entrance. Default: mobile number + SMS one-time code
 * (needs an SMS provider or test numbers in Supabase → Authentication → Phone).
 * Alternative: email + password, for demo accounts and until SMS is live.
 */
export default function SignIn() {
  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function signInWithEmail() {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSentTo(null);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: noir }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }} keyboardShouldPersistTaps="handled">
          <View style={st.hero}>
            <View style={st.mark}>
              <Text style={{ fontFamily: font.displaySemi, fontSize: 30, color: colors.champagne }}>S</Text>
            </View>
            <Text style={st.brand}>The Skin Sensé</Text>
            <Text style={st.eyebrow}>Banjara Hills · Hyderabad</Text>
            <View style={st.rule} />
            <Text style={st.headline}>
              Your skin,{"\n"}
              <Text style={{ fontFamily: font.displayItalic, fontSize: 42, lineHeight: 44, color: colors.champagne }}>in good hands.</Text>
            </Text>
          </View>

          <View style={st.card}>
            <View pointerEvents="none" style={st.cardFrame} />
            <Text style={st.portal}>VIII · Patient</Text>

            {mode === "email" ? (
              <>
                <Text style={st.cardTitle}>Welcome back</Text>
                <LuxField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <LuxField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  onSubmitEditing={signInWithEmail}
                />
                <LuxButton label="Enter" onPress={signInWithEmail} busy={busy} />
              </>
            ) : !sentTo ? (
              <>
                <Text style={st.cardTitle}>Welcome</Text>
                <Text style={st.cardBody}>We’ll send a one-time code to the number registered at the clinic.</Text>
                <LuxField
                  label="Mobile number"
                  prefix="+91"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  maxLength={14}
                />
                <LuxButton label="Send code" onPress={sendCode} busy={busy} />
              </>
            ) : (
              <>
                <Text style={st.cardTitle}>Enter your code</Text>
                <Text style={st.cardBody}>Sent to {sentTo}</Text>
                <LuxField
                  label="6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  style={{ letterSpacing: 10, textAlign: "center" }}
                />
                <LuxButton label="Verify" onPress={verify} busy={busy} disabled={code.length < 6} />
                <Pressable onPress={() => setSentTo(null)} accessibilityRole="button" style={st.link}>
                  <Text style={st.linkText}>Use a different number</Text>
                </Pressable>
              </>
            )}

            {error ? <Text style={st.error}>{error}</Text> : null}

            <Pressable onPress={() => switchMode(mode === "phone" ? "email" : "phone")} accessibilityRole="button" style={st.link}>
              <Text style={st.linkText}>{mode === "phone" ? "Sign in with email instead" : "Sign in with mobile number instead"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LuxField({ label, prefix, style, ...input }: TextInputProps & { label: string; prefix?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={st.fieldRow}>
        {prefix ? <Text style={[st.fieldText, { color: colors.muted }]}>{prefix}</Text> : null}
        <TextInput placeholderTextColor="#B9A6B4" accessibilityLabel={label} {...input} style={[st.fieldText, { flex: 1, paddingVertical: 10 }, style]} />
      </View>
    </View>
  );
}

function LuxButton({ label, onPress, busy, disabled }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      style={({ pressed }) => [st.button, { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {busy ? <ActivityIndicator color={colors.champagne} /> : <Text style={st.buttonText}>{label}</Text>}
    </Pressable>
  );
}

const st = StyleSheet.create({
  hero: { alignItems: "center", paddingTop: 56, paddingHorizontal: space.xxl, gap: 10 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: goldBright,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brand: { fontFamily: font.displaySemi, fontSize: 30, color: colors.white, letterSpacing: 0.5 },
  eyebrow: { fontFamily: font.bodyMedium, fontSize: 10, letterSpacing: 3.2, textTransform: "uppercase", color: goldBright },
  rule: { width: 48, height: 1, backgroundColor: goldBright, opacity: 0.6, marginVertical: 14 },
  headline: { fontFamily: font.display, fontSize: 42, lineHeight: 44, color: colors.white, textAlign: "center" },
  card: {
    margin: space.xl,
    marginTop: 40,
    backgroundColor: colors.cream,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 34,
    gap: 18,
  },
  cardFrame: {
    position: "absolute",
    top: 9,
    left: 9,
    right: 9,
    bottom: 9,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(216,183,126,0.5)",
  },
  portal: { fontFamily: font.bodyMedium, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: colors.goldText, textAlign: "center" },
  cardTitle: { fontFamily: font.display, fontSize: 34, color: colors.plumDeep, textAlign: "center", marginTop: -6 },
  cardBody: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: "center" },
  fieldLabel: { fontFamily: font.bodyMedium, fontSize: 10, letterSpacing: 2.6, textTransform: "uppercase", color: colors.goldText },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#E7D6C0" },
  fieldText: { fontFamily: font.display, fontSize: 24, color: colors.plumDeep },
  button: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: noir,
    borderWidth: 1,
    borderColor: "rgba(184,147,90,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonText: { fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 3.4, textTransform: "uppercase", color: colors.champagne },
  link: { alignSelf: "center", minHeight: 44, justifyContent: "center" },
  linkText: { fontFamily: font.bodyMedium, fontSize: 12, color: colors.plum },
  error: { fontFamily: font.body, fontSize: 12, color: colors.danger, textAlign: "center" },
});
