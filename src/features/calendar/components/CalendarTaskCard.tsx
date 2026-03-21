import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/calendar.styles";
import type { CalendarTaskItem } from "../utils/calender.types";

interface CalendarTaskCardProps {
  item: CalendarTaskItem;
  onOpenTaskQueue: (item: CalendarTaskItem) => void;
}

export function CalendarTaskCard({ item, onOpenTaskQueue }: CalendarTaskCardProps) {
  const leadStyle =
    item.leadStatus === "late"
      ? styles.eventLeadLate
      : item.leadStatus === "upcoming"
        ? styles.eventLeadUpcoming
        : styles.eventLeadNone;

  return (
    <View style={styles.tasksContainer}>
      <View style={styles.eventCard}>
        <Text style={[styles.eventLead, leadStyle]}>{item.leadLabel}</Text>
        <Text style={styles.eventTitle}>{item.title}</Text>
        
        <View style={styles.eventMeta}>
          <Ionicons name="time" size={14} style={styles.eventMetaIcon} />
          <Text style={styles.eventMetaText}>{item.metaText}</Text>
        </View>
        <TouchableOpacity
          style={styles.eventActionButton}
          onPress={() => onOpenTaskQueue(item)}
        >
          <Text style={styles.eventActionText}>Open Task Queue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
