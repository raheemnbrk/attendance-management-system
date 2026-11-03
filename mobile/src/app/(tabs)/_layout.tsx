import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { GlassTabBar } from "@/shared/components/navigation/GlassTabBar";
import { useTheme } from "@/shared/theme/theme-provider";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Typing (e.g. the change-password form) must not fight the tab bar.
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "today" : "today-outline"}
              size={size}
              color={(color ?? colors.primary) as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={size}
              color={(color ?? colors.primary) as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={(color ?? colors.primary) as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
