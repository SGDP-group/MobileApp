import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./BottomNav.styles";

export type BottomNavRoute =
  | "Home"
  | "Calendar"
  | "Focus"
  | "Analytics"
  | "Settings";

interface BottomNavProps {
  activeRoute?: BottomNavRoute;
  onPress?: (route: BottomNavRoute) => void;
}

const items: Array<{
  id: BottomNavRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "Home", label: "Home", icon: "home" },
  { id: "Calendar", label: "Calendar", icon: "calendar" },
  { id: "Focus", label: "Focus", icon: "eye" },
  { id: "Analytics", label: "Analytics", icon: "stats-chart" },
  { id: "Settings", label: "Settings", icon: "settings" },
];

export function BottomNav({ activeRoute, onPress }: BottomNavProps) {
  const navigation = useNavigation<RootNavigationProp>();

  const handlePress = (route: BottomNavRoute) => {
    if (onPress) {
      onPress(route);
      return;
    }

    switch (route) {
      case "Home":
        navigation.navigate("Home", {});
        return;
      case "Calendar":
        navigation.navigate("Calendar");
        return;
      case "Focus":
        navigation.navigate("Focus");
        return;
      case "Analytics":
        navigation.navigate("Analytics");
        return;
      case "Settings":
        Alert.alert("Settings", "Settings are coming soon.");
        return;
      default:
        Alert.alert("Action", "This action is coming soon.");
    }
  };

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const isActive = item.id === activeRoute;
        return (
          <TouchableOpacity
            key={item.id}
            style={isActive ? styles.bottomItemActive : styles.bottomItem}
            onPress={() => handlePress(item.id)}
          >
            <Ionicons
              name={item.icon}
              size={25}
              color={isActive ? "#54D2FF" : "#6E808A"}
            />
            <Text
              style={isActive ? styles.bottomLabelActive : styles.bottomLabel}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
