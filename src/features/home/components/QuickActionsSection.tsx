import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles/home.styles";
import { QuickActionCard } from "./QuickActionCard";

export interface HomeQuickAction {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

interface QuickActionsSectionProps {
  actions: readonly HomeQuickAction[];
  onActionPress: (actionId: string) => void;
}

export function QuickActionsSection({
  actions,
  onActionPress,
}: QuickActionsSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            label={action.label}
            icon={action.icon}
            onPress={() => onActionPress(action.id)}
          />
        ))}
      </View>
    </>
  );
}
