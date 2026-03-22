import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/calendar.styles";

interface TaskQueueHeaderProps {
  onBackPress: () => void;
  onAddTaskPress: () => void;
}

export function TaskQueueHeader({ onBackPress, onAddTaskPress }: TaskQueueHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Ionicons name="chevron-back" size={32} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Task Queue</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.addButton} onPress={onAddTaskPress}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
