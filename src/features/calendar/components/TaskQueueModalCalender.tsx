import Ionicons from "@expo/vector-icons/Ionicons";
import { getSubtasksByTask } from "@services/focusFrameSubtaskService";
import { getSafeErrorMessage } from "@utils/securityUtils";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { HomeTask } from "../../home/home.tasks";
import { styles } from "../styles/taskQueueModalCalender.styles";
import {
  formatDateObject,
  formatDateTime,
  formatDuration,
  getSubtaskDuration,
  toSafeDate,
} from "../utils/taskQueueModalCalender.utils";
import { SubtaskAccordionItem } from "./EditableSubtaskAccordionItem";

interface TaskQueueModalProps {
  visible: boolean;
  task: HomeTask | null;
  onClose: () => void;
}

export function TaskQueueModal({ visible, task, onClose }: TaskQueueModalProps) {
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<NonNullable<HomeTask["subtasks"]>>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!visible || !task?.id) {
      setSubtasks([]);
      setIsLoadingSubtasks(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoadingSubtasks(true);
    setSubtasks([]);

    void (async () => {
      try {
        const fetchedSubtasks = await getSubtasksByTask(task.id);
        if (!isActive) {
          return;
        }

        setSubtasks(Array.isArray(fetchedSubtasks) ? fetchedSubtasks : []);

      } catch (error) {
        console.warn(
          `Failed to load subtasks for task ${task.id}:`,
          getSafeErrorMessage(error),
        );

        if (isActive) {
          setSubtasks([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingSubtasks(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [task?.id, visible]);

  useEffect(() => {
    if (!visible || subtasks.length === 0) {
      setExpandedSubtaskIds([]);
      return;
    }

    setExpandedSubtaskIds(subtasks.map((subtask) => subtask.id));
  }, [subtasks, visible]);

  const sortedSubtasks = useMemo(() => {
    if (subtasks.length === 0) {
      return [];
    }

    return [...subtasks]
      .sort((a, b) => {
        const aOrder =
          typeof a.taskOrder === "number" ? a.taskOrder : Number.MAX_SAFE_INTEGER;
        const bOrder =
          typeof b.taskOrder === "number" ? b.taskOrder : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        const aStart = toSafeDate(a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = toSafeDate(b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
      });
  }, [subtasks]);

  const derivedMainDescription = useMemo(() => {
    const firstDescription = sortedSubtasks.find(
      (subtask) => typeof subtask.description === "string" && subtask.description.trim().length > 0,
    );

    if (firstDescription?.description) {
      return firstDescription.description;
    }

    if (typeof task?.description === "string" && task.description.trim().length > 0) {
      return task.description;
    }

    return "No description available";
  }, [sortedSubtasks, task?.description]);

  const derivedMainDuration = useMemo(() => {
    const totalDuration = sortedSubtasks.reduce((total, subtask) => {
      return total + getSubtaskDuration(subtask.duration, subtask.estimatedTime);
    }, 0);

    return totalDuration;
  }, [sortedSubtasks]);

  const derivedStartTime = useMemo(() => {
    if (sortedSubtasks.length === 0) {
      return formatDateTime(task?.updatedAt);
    }

    let earliestStartTimestamp: number | null = null;

    sortedSubtasks.forEach((subtask) => {
      const startDate = toSafeDate(subtask.startTime);
      if (!startDate) {
        return;
      }

      const startTimestamp = startDate.getTime();
      if (earliestStartTimestamp === null || startTimestamp < earliestStartTimestamp) {
        earliestStartTimestamp = startTimestamp;
      }
    });

    if (!earliestStartTimestamp) {
      return formatDateTime(task?.updatedAt);
    }

    return formatDateObject(new Date(earliestStartTimestamp));
  }, [sortedSubtasks, task?.updatedAt]);

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

    return formatDateObject(new Date(latestEndTimestamp));
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
             

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Description</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedMainDescription}</Text>
                </View>

                {/* <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Start time</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedStartTime}</Text>
                </View> */}

                {/* <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Deadline</Text>
                  <Text style={styles.taskQueueFieldValue}>{derivedDeadline}</Text>
                </View>

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Duration</Text>
                  <Text style={styles.taskQueueFieldValue}>{formatDuration(derivedMainDuration)}</Text>
                </View> */}
              </View>

              <View style={styles.taskQueueSubtasksSection}>
                <Text style={styles.taskQueueSectionTitle}>Subtasks</Text>

                {isLoadingSubtasks ? (
                  <Text style={styles.taskQueueNoSubtasksText}>Loading subtasks...</Text>
                ) : sortedSubtasks.length === 0 ? (
                  <Text style={styles.taskQueueNoSubtasksText}>No subtasks available.</Text>
                ) : (
                  sortedSubtasks.map((subtask) => {
                    const isExpanded = expandedSubtaskIds.includes(subtask.id);

                    return (
                      <SubtaskAccordionItem
                        key={subtask.id}
                        subtask={subtask}
                        isExpanded={!isExpanded}
                        onToggle={toggleSubtask}
                      />
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
