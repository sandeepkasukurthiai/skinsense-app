import { colors, radii } from "@skinsense/shared";

export { colors, radii };

/** Font family names registered in app/_layout.tsx via expo-font. */
export const font = {
  display: "CormorantGaramond_500Medium",
  displaySemi: "CormorantGaramond_600SemiBold",
  displayItalic: "CormorantGaramond_500Medium_Italic",
  body: "MerriweatherSans_400Regular",
  bodyLight: "MerriweatherSans_300Light",
  bodyMedium: "MerriweatherSans_500Medium",
  bodySemi: "MerriweatherSans_600SemiBold",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
