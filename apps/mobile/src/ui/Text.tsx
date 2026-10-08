import { Text as RNText, type TextProps, type TextStyle } from "react-native";

import { colors, font } from "./theme";

type Variant = "display" | "title" | "heading" | "body" | "bodyStrong" | "caption" | "eyebrow" | "label";

const styles: Record<Variant, TextStyle> = {
  display: { fontFamily: font.display, fontSize: 38, lineHeight: 40, color: colors.plumDeep },
  title: { fontFamily: font.display, fontSize: 30, lineHeight: 32, color: colors.plumDeep },
  heading: { fontFamily: font.displaySemi, fontSize: 24, lineHeight: 28, color: colors.plumDeep },
  body: { fontFamily: font.body, fontSize: 13, lineHeight: 20, color: colors.ink },
  bodyStrong: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: colors.ink },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 18, color: colors.muted },
  eyebrow: {
    fontFamily: font.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.goldText,
  },
  label: { fontFamily: font.bodyMedium, fontSize: 11, color: colors.ink },
};

export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  return <RNText {...rest} style={[styles[variant], style]} />;
}
