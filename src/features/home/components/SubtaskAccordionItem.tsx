import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/taskQueueModal.styles";
import {
  formatDateObject,
  formatDateTime,
  formatDuration,
  getStatusLabel,
  getSubtaskDuration,
  toSafeDate,
  type HomeSubtask
} from "../utils/taskQueueModal.utils";

interface SubtaskAccordionItemProps {
  subtask: HomeSubtask;
  isExpanded: boolean;
  onToggle: (subtaskId: number) => void;
}

export function SubtaskAccordionItem({
  subtask,
  isExpanded,
  onToggle,
}: SubtaskAccordionItemProps) {
  

  const statusLabel = getStatusLabel(subtask.completed);


  const duration = getSubtaskDuration(subtask.duration, subtask.estimatedTime);
    

  const endDate = useMemo(() => {
    const startDate = toSafeDate(subtask.startTime);
    if (!startDate || duration <= 0) {
      return null;
    }

    return new Date(startDate.getTime() + duration * 60 * 1000);
  }, [duration, subtask.startTime]);

  return (
    <View style={styles.subtaskAccordionCard}>
      <TouchableOpacity
        style={styles.subtaskAccordionHeader}
        onPress={() => onToggle(subtask.id)}
      >
        <View style={styles.subtaskAccordionTitleWrap}>
          <Text style={styles.subtaskOrderBadge}>#{subtask.taskOrder ?? "-"}</Text>
          <Text style={styles.subtaskAccordionTitle}>{subtask.name}</Text>
        </View>
        <View style={styles.subtaskHeaderRight}>
          <Text
            style={[
              styles.subtaskStatusBadge,
              subtask.completed
                ? styles.subtaskStatusBadgeCompleted
                : styles.subtaskStatusBadgePending,
            ]}
          >
            {statusLabel}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#70E1FF"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.subtaskAccordionBody}>
          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Description</Text>
            <Text style={styles.taskQueueFieldValue}>
              {subtask.description?.trim() || "No description"}
            </Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Start Time</Text>
            <Text style={styles.taskQueueFieldValue}>
              {formatDateTime(subtask.startTime)}
            </Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>End Time</Text>
            <Text style={styles.taskQueueFieldValue}>{formatDateObject(endDate)}</Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Duration</Text>
            <Text style={styles.taskQueueFieldValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Status</Text>
            <Text style={styles.taskQueueFieldValue}>{statusLabel}</Text>
            
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Complete</Text>
            <Text style={styles.taskQueueFieldValue}>
              {subtask.completed ? "Yes" : "No"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
