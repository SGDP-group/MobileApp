import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { HomeTask, HomeUpNextItem } from "../home.tasks";
import { styles } from "../styles/home.styles";
import { formatTaskLeadMeta, formatTaskTimestamp } from "../utils/home.helpers";

interface UpNextCardProps {
  item: HomeUpNextItem;
  onOpenTaskQueue: (task?: HomeTask) => void;
}

export function UpNextCard({ item, onOpenTaskQueue }: UpNextCardProps) {
  if (item.type === "loading") {
    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventLead}>LOADING</Text>
        <Text style={styles.eventTitle}>Fetching tasks...</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={14} color="#8DA7B5" />
          <Text style={styles.eventMetaText}>Please wait</Text>
        </View>
      </View>
    );
  }

  if (item.type === "empty") {
    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventLead}>NO TASKS</Text>
        <Text style={styles.eventTitle}>No tasks in your queue</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#8DA7B5" />
          <Text style={styles.eventMetaText}>Create your first task</Text>
        </View>
        <TouchableOpacity
          style={styles.eventActionButton}
          onPress={() => onOpenTaskQueue()}
        >
          <Text style={styles.eventActionText}>Open Task Queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const taskLead = formatTaskLeadMeta(item.task);
  const leadStyle =
    taskLead.status === "late"
      ? styles.eventLeadLate 
      : taskLead.status === "upcoming"
        ? styles.eventLeadUpcoming
        : styles.eventLeadNone;
  const taskStartTimestamp = taskLead.startDateOfIncompleteSubtask
    ? formatTaskTimestamp(taskLead.startDateOfIncompleteSubtask.toISOString())
    : formatTaskTimestamp(item.task.updatedAt);

  return (
    <View style={styles.eventCard}>
      <Text style={[styles.eventLead, leadStyle]}>{taskLead.label}</Text>
      <Text style={styles.eventTitle}>{item.task.name}</Text>
      <View style={styles.eventMeta}>
        <Ionicons name="time" size={14} style={styles.eventMetaIcon} />
        <Text style={styles.eventMetaText}>
          Start {taskStartTimestamp}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.eventActionButton}
        onPress={() => onOpenTaskQueue(item.task)}
      >
        <Text style={styles.eventActionText}>Open Task Queue</Text>
      </TouchableOpacity>
    </View>
  );
}
