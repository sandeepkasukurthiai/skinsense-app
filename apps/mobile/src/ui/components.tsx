import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { colors, font, radii, space } from "./theme";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text variant="heading">{title}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
            <Text variant="label" style={{ color: colors.plum }}>
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "gold" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const bg = variant === "primary" ? colors.plum : variant === "gold" ? colors.gold : "transparent";
  const fg = variant === "primary" ? colors.white : variant === "gold" ? "#2A0823" : colors.plum;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: fg }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[s.chip, active && { backgroundColor: colors.plum, borderColor: colors.plum }]}
    >
      <Text variant="label" style={{ color: active ? colors.white : colors.plum }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.xxxl }}>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body ? (
        <Text variant="caption" style={{ textAlign: "center" }}>
          {body}
        </Text>
      ) : null}
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: space.xxxl, alignItems: "center" }}>
      <ActivityIndicator color={colors.plum} />
    </View>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ gap: space.sm }}>
      <Text variant="bodyStrong" style={{ color: colors.danger }}>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" variant="ghost" onPress={onRetry} /> : null}
    </Card>
  );
}

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityLabel="Back" style={s.iconBtn}>
          <Icon name="back" size={18} color={colors.plumDeep} />
        </Pressable>
      ) : null}
      <Text variant="title">{title}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blush },
  scrollContent: { paddingBottom: 120 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md + 2,
    padding: space.xl,
  },
  section: { paddingHorizontal: space.xl, paddingTop: 26, gap: space.md },
  sectionHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 4 },
  button: {
    minHeight: 50,
    borderRadius: radii.pill,
    paddingHorizontal: space.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lilac,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.xl, paddingTop: space.md },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
