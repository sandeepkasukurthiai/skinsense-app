import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "./theme";

export type IconName =
  | "search"
  | "bell"
  | "calendar"
  | "video"
  | "rx"
  | "card"
  | "home"
  | "drop"
  | "trend"
  | "user"
  | "plus"
  | "check"
  | "star"
  | "chevron"
  | "back"
  | "phone"
  | "pin"
  | "camera";

/** Thin-stroke line icons matching the design (24×24 grid). */
export function Icon({
  name,
  size = 22,
  color = colors.plum,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = { stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "search" && (
        <>
          <Circle cx={11} cy={11} r={7} {...p} />
          <Path d="M20 20l-3.5-3.5" {...p} />
        </>
      )}
      {name === "bell" && (
        <>
          <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...p} />
          <Path d="M10 20a2 2 0 0 0 4 0" {...p} />
        </>
      )}
      {name === "calendar" && (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} {...p} />
          <Path d="M8 3v4M16 3v4M4 10h16M12 13v4M10 15h4" {...p} />
        </>
      )}
      {name === "video" && (
        <>
          <Rect x={3} y={6} width={13} height={12} rx={3} {...p} />
          <Path d="M16 10l5-3v10l-5-3" {...p} />
        </>
      )}
      {name === "rx" && (
        <>
          <Path d="M7 3h7l5 5v13H7z" {...p} />
          <Path d="M14 3v5h5M10 13h6M10 17h4" {...p} />
        </>
      )}
      {name === "card" && (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={3} {...p} />
          <Path d="M3 10h18M7 15h4" {...p} />
        </>
      )}
      {name === "home" && (
        <>
          <Path d="M4 11l8-7 8 7v9H4z" {...p} />
          <Path d="M10 20v-5h4v5" {...p} />
        </>
      )}
      {name === "drop" && <Path d="M12 3c4 3 6 6 6 9a6 6 0 0 1-12 0c0-3 2-6 6-9z" {...p} />}
      {name === "trend" && (
        <>
          <Path d="M4 19l5-6 4 3 7-9" {...p} />
          <Path d="M15 7h5v5" {...p} />
        </>
      )}
      {name === "user" && (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 20c1.5-4 5-5 8-5s6.5 1 8 5" {...p} />
        </>
      )}
      {name === "plus" && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === "check" && <Path d="M5 12l5 5 9-10" {...p} />}
      {name === "chevron" && <Path d="M9 6l6 6-6 6" {...p} />}
      {name === "back" && <Path d="M15 6l-6 6 6 6" {...p} />}
      {name === "star" && (
        <Path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill={color} stroke="none" />
      )}
      {name === "phone" && (
        <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...p} />
      )}
      {name === "pin" && (
        <>
          <Path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" {...p} />
          <Circle cx={12} cy={9} r={2.5} {...p} />
        </>
      )}
      {name === "camera" && (
        <>
          <Path d="M4 8h3l2-3h6l2 3h3v11H4z" {...p} />
          <Circle cx={12} cy={13} r={3.5} {...p} />
        </>
      )}
    </Svg>
  );
}
