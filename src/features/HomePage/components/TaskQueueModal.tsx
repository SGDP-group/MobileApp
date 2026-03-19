import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { HomeTask } from "../home.tasks";
import { styles } from "../styles/taskQueueModal.styles";

interface TaskQueueModalProps {
  visible: boolean;
  task: HomeTask | null;
  onClose: () => void;
}

const toSafeDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const asDate = new Date(value.trim());
  if (!Number.isNaN(asDate.getTime())) {
    return asDate;
  }

  const timeMatch = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/);

  if (!timeMatch) {
    return null;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const seconds = Number(timeMatch[3] ?? "0");

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
};

const formatDateTime = (value?: string): string => {
  const date = toSafeDate(value);
  if (!date) {
    return "Not set";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDuration = (durationMinutes?: number): string => {
  if (!durationMinutes || durationMinutes <= 0) {
    return "Not set";
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const getSubtaskDuration = (duration?: number, estimatedTime?: number): number => {
  if (typeof duration === "number" && duration > 0) {
    return duration;
  }

  if (typeof estimatedTime === "number" && estimatedTime > 0) {
    return estimatedTime;
  }

  return 0;
};

const getStatusLabel = (statusId?: number, completed?: boolean): string => {
  if (completed) {
    return "Completed";
  }

  if (statusId === 2) {
    return "In Progress";
  }

  if (statusId === 3) {
    return "Completed";
  }

  return "Pending";
};

export function TaskQueueModal({ visible, task, onClose }: TaskQueueModalProps) {
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<number[]>([]);

  useEffect(() => {
    if (!visible || !task?.subtasks?.length) {
      return;
    }

    setExpandedSubtaskIds(task.subtasks.map((subtask) => subtask.id));
  }, [task, visible]);

  const sortedSubtasks = useMemo(() => {
    if (!task?.subtasks) {
      return [];
    }

    return [...task.subtasks].sort((a, b) => {
      const aOrder = typeof a.taskOrder === "number" ? a.taskOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.taskOrder === "number" ? b.taskOrder : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
  }, [task]);

  const derivedMainDescription = useMemo(() => {
    const firstDescription = sortedSubtasks.find(
      (subtask) => typeof subtask.description === "string" && subtask.description.trim().length > 0,
    );

    if (firstDescription?.description) {
      return firstDescription.description;
    }

    return "No description available";
  }, [sortedSubtasks]);

  const derivedMainDuration = useMemo(() => {
    const totalDuration = sortedSubtasks.reduce((total, subtask) => {
      return total + getSubtaskDuration(subtask.duration, subtask.estimatedTime);
    }, 0);

    return totalDuration;
  }, [sortedSubtasks]);

  const derivedDeadline = useMemo(() => {
    if (sortedSubtasks.length === 0) {
      return formatDateTime(task?.updatedAt);
    }
    

    let latestEndTimestamp: number | null = null;

    sortedSubtasks.forEach((subtask) => {
      const startDate = toSafeDate(subtask.startTime);
      const duration = getSubtaskDuration(subtask.duration, subtask.estimatedTime);

      if (!startDate || duration <= 0) {
        return;
      }

      const endTimestamp = startDate.getTime() + duration * 60 * 1000;
      if (!latestEndTimestamp || endTimestamp > latestEndTimestamp) {
        latestEndTimestamp = endTimestamp;
      }
    });

    if (!latestEndTimestamp) {
      return formatDateTime(task?.updatedAt);
    }

    return new Date(latestEndTimestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [sortedSubtasks, task?.updatedAt]);

  const toggleSubtask = (subtaskId: number) => {
    setExpandedSubtaskIds((prev) => {
      if (prev.includes(subtaskId)) {
        return prev.filter((id) => id !== subtaskId);
      }

      return [...prev, subtaskId];
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.taskQueueModalOverlay}>
        <View style={styles.taskQueueModalContent}>
          <View style={styles.taskQueueModalHeader}>
            <Text style={styles.taskQueueModalTitle}>{!task ? "Task Queue" : task.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#E5F7FF" />
            </TouchableOpacity>
          </View>

          {!task ? (
            <View style={styles.taskQueueEmptyState}>
              <Text style={styles.taskQueueEmptyTitle}>No Task Selected</Text>
              <Text style={styles.taskQueueEmptyText}>
                Choose a task from Up Next to view queue details.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.taskQueueBody}
              contentContainerStyle={styles.taskQueueBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.taskQueueMainSection}>
                {/* <Text style={styles.taskQueueSectionTitle}>Main Task</Text> */}
{/* 
                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Name</Text>
                  <Text style={styles.taskQueueFieldValue}>{task.name}</Text>
                </View> */}

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Description</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedMainDescription}</Text>
                </View>

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Start time</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedDeadline}</Text>
                </View>

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Deadline</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedDeadline}</Text>
                </View>

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Duration</Text>
                  <Text style={styles.taskQueueFieldValue}>{formatDuration(derivedMainDuration)}</Text>
                </View>
              </View>

              <View style={styles.taskQueueSubtasksSection}>
                <Text style={styles.taskQueueSectionTitle}>Subtasks</Text>

                {sortedSubtasks.length === 0 ? (
                  <Text style={styles.taskQueueNoSubtasksText}>No subtasks available.</Text>
                ) : (
                  sortedSubtasks.map((subtask) => {
                    const isExpanded = expandedSubtaskIds.includes(subtask.id);
                    const duration = getSubtaskDuration(subtask.duration, subtask.estimatedTime);
                    const startDate = toSafeDate(subtask.startTime);
                    const endDate = startDate
                      ? new Date(startDate.getTime() + duration * 60 * 1000)
                      : null;

                    return (
                      <View key={subtask.id} style={styles.subtaskAccordionCard}>
                        <TouchableOpacity
                          style={styles.subtaskAccordionHeader}
                          onPress={() => toggleSubtask(subtask.id)}
                        >
                          <View style={styles.subtaskAccordionTitleWrap}>
                            <Text style={styles.subtaskOrderBadge}>#{subtask.taskOrder ?? "-"}</Text>
                            <Text style={styles.subtaskAccordionTitle}>{subtask.name}</Text>
                          </View>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#70E1FF"
                          />
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
                              <Text style={styles.taskQueueFieldValue}>
                                {endDate
                                  ? endDate.toLocaleString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })
                                  : "Not set"}
                              </Text>
                            </View>

                            <View style={styles.taskQueueFieldRow}>
                              <Text style={styles.taskQueueFieldLabel}>Duration</Text>
                              <Text style={styles.taskQueueFieldValue}>{formatDuration(duration)}</Text>
                            </View>

                            <View style={styles.taskQueueFieldRow}>
                              <Text style={styles.taskQueueFieldLabel}>Status</Text>
                              <Text style={styles.taskQueueFieldValue}>
                                {getStatusLabel(subtask.statusId, subtask.completed)}
                              </Text>
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
                  })
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
