import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import StyledAlert from "@shared/components/StyledAlert";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./BottomNav.styles";

export type BottomNavRoute =
  | "Home"
  | "Calendar"
  | "Add Task"
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
  { id: "Add Task", label: "Add Task", icon: "add-circle" },
  { id: "Analytics", label: "Analytics", icon: "stats-chart" },
  // { id: "Settings", label: "Settings", icon: "settings" },
];

export function BottomNav({ activeRoute, onPress }: BottomNavProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
    type?: "info" | "success" | "warning" | "error";
  }>({ title: "", message: "", buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>,
    type?: "info" | "success" | "warning" | "error",
  ) => {
    setAlertConfig({ title, message, buttons, type });
    setAlertVisible(true);
  };

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
      case "Add Task":
        navigation.navigate("AddTask");
        return;
      case "Analytics":
        navigation.navigate("Analytics");
        return;
      // case "Settings":
      //   showAlert("Settings", "Settings are coming soon.", [{ text: "OK", onPress: () => setAlertVisible(false) }]);
      //   return;
      default:
        showAlert("Action", "This action is coming soon.", [{ text: "OK", onPress: () => setAlertVisible(false) }], "info");
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
      <StyledAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </View>
  );
}
