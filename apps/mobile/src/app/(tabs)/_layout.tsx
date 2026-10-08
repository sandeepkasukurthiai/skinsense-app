import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { colors, font } from "@/ui/theme";

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "treatments", label: "Treatments", icon: "drop" },
  { name: "book", label: "Book", icon: "plus" },
  { name: "journey", label: "Journey", icon: "trend" },
  { name: "profile", label: "Profile", icon: "user" },
];

/** Custom bar matching the design: white bar, raised plum "Book" button in the centre. */
function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (tab.name === "book") {
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="button" accessibilityLabel="Book appointment" style={st.fab}>
              <Icon name="plus" color={colors.champagne} strokeWidth={2} />
            </Pressable>
          );
        }
        const color = focused ? colors.plum : colors.muted;
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={st.item}
          >
            <Icon name={tab.icon} color={color} strokeWidth={focused ? 1.8 : 1.5} />
            <Text style={{ fontSize: 10, color, fontFamily: focused ? font.bodySemi : font.body }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0E2EC",
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: { alignItems: "center", gap: 4, minWidth: 56, minHeight: 44, paddingTop: 6 },
  fab: {
    width: 58,
    height: 58,
    marginTop: -24,
    borderRadius: 29,
    backgroundColor: colors.plum,
    borderWidth: 4,
    borderColor: colors.blush,
    alignItems: "center",
    justifyContent: "center",
  },
});
