import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useTheme } from "../theme";
import { AppText } from "./ui";
import { CELEBRATIONS, type CelebrationType } from "../lib/celebrations";

// Phase M — app-wide celebration overlay (mobile). Mirrors the web provider:
// mount once at the root; call `useCelebrate()(type)` anywhere. Premium, non-
// intrusive top banner that animates in/out and auto-dismisses.

type CelebrateFn = (type: CelebrationType, opts?: { message?: string }) => void;

const CelebrationContext = createContext<CelebrateFn>(() => {});
export function useCelebrate(): CelebrateFn {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [active, setActive] = useState<{ type: CelebrationType; message?: string } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback<CelebrateFn>((type, opts) => {
    setActive({ type, message: opts?.message });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(null), 5000);
  }, []);

  useEffect(() => {
    if (active) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
    }
  }, [active, anim]);

  const def = active ? CELEBRATIONS[active.type] : null;

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      {def ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute", top: 56, left: 16, right: 16, zIndex: 1000,
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
          }}
        >
          <Pressable
            onPress={() => setActive(null)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: "#161616", borderRadius: theme.radius.xl,
              padding: theme.spacing.md, borderWidth: 1, borderColor: c.primary,
              shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 12,
            }}
          >
            <View style={{ height: 48, width: 48, borderRadius: 14, backgroundColor: "rgba(231,55,37,0.18)", alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 24 }}>{def.emoji}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 16 }}>{def.title}</AppText>
              <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{active?.message ?? def.message}</AppText>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </CelebrationContext.Provider>
  );
}
