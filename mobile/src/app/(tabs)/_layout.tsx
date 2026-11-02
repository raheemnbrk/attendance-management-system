import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fontSize } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "600",
        },
      }}
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
    </Tabs>
  );
}
