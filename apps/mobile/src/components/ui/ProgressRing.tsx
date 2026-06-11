import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme";

interface Props {
  /** 0..1 completion. */
  progress: number;
  size?: number;
  /** Number of segments around the ring (Apple-Watch-style activity ring). */
  segments?: number;
  dotSize?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}

/**
 * Dependency-free circular progress, drawn as evenly spaced segments around a
 * ring (no react-native-svg needed). Filled segments use the brand red; the
 * remainder use the muted track. Premium "activity ring" feel.
 */
export default function ProgressRing({
  progress,
  size = 132,
  segments = 24,
  dotSize = 9,
  color,
  trackColor,
  children,
}: Props) {
  const { theme } = useTheme();
  const fill = color ?? theme.colors.primary;
  const track = trackColor ?? theme.colors.borderStrong;

  const p = Math.max(0, Math.min(1, progress));
  const filled = Math.round(p * segments);
  const radius = size / 2 - dotSize / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: segments }).map((_, i) => {
        // Start at 12 o'clock, go clockwise.
        const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
        const x = cx + radius * Math.cos(angle) - dotSize / 2;
        const y = cy + radius * Math.sin(angle) - dotSize / 2;
        const on = i < filled;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: on ? fill : track,
              opacity: on ? 1 : 0.5,
            }}
          />
        );
      })}
      <View style={{ alignItems: "center", justifyContent: "center" }}>{children}</View>
    </View>
  );
}
