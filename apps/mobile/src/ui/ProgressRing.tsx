import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Text } from "./Text";
import { colors, font } from "./theme";

export function ProgressRing({ done, total, size = 76 }: { done: number; total: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${done} of ${total} sessions done`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#F4E6F0" strokeWidth={7} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.gold}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: font.displaySemi, fontSize: 24, color: colors.plumDeep, lineHeight: 26 }}>
          {done}/{total}
        </Text>
        <Text style={{ fontSize: 9, color: colors.muted, letterSpacing: 1, textTransform: "uppercase" }}>sessions</Text>
      </View>
    </View>
  );
}
