import { colors } from "@shared/theme/colors";
import React from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/calendar.styles";
import type { CalendarTaskItem } from "./../utils/calendar.types";
import { CalendarTaskCard } from "./CalendarTaskCard";

interface CalendarTaskListSectionProps {
  isLoading: boolean;
  items: CalendarTaskItem[];
  onRefresh: () => void;
  onAddTaskPress: () => void;
  onOpenTaskQueue: (item: CalendarTaskItem) => void;
}

export function CalendarTaskListSection({
  isLoading,
  items,
  onRefresh,
  onAddTaskPress,
  onOpenTaskQueue,
}: CalendarTaskListSectionProps) {
  if (isLoading) {
    
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={styles.loadingIndicator}
        />
        <Text style={styles.emptyText}>Loading tasks...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No incomplete tasks for today</Text>
        <TouchableOpacity style={styles.addEventButton} onPress={onAddTaskPress}>
          <Text style={styles.addEventButtonText}>Add Your First Task</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <CalendarTaskCard item={item} onOpenTaskQueue={onOpenTaskQueue} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}
