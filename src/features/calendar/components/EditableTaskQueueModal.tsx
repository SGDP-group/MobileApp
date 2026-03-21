import Ionicons from "@expo/vector-icons/Ionicons";
import { getSubtaskStatuses, getSubtasksByTask, patchSubtask } from "@services/focusFrameSubtaskService";
import { getSafeErrorMessage } from "@utils/securityUtils";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { HomeTask } from "../../home/home.tasks";
import { styles } from "../styles/taskQueueModalCalender.styles";
import {
  formatDateObject,
  formatDateTime,
  getSubtaskDuration,
  toSafeDate,
  type HomeSubtask,
  type SubtaskStatus,
} from "../utils/taskQueueModalCalender.utils";
import { SubtaskAccordionItem } from "./EditableSubtaskAccordionItem";

interface TaskQueueModalProps {
  visible: boolean;
  task: HomeTask | null;
  onClose: () => void;
  onEditTask?: (
    task: HomeTask,
    updates: { name: string; description?: string },
  ) => Promise<void> | void;
  onDeleteTask?: (task: HomeTask) => Promise<void> | void;
}

export function TaskQueueModal({
  visible,
  task,
  onClose,
  onEditTask,
  onDeleteTask,
}: TaskQueueModalProps) {
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<NonNullable<HomeTask["subtasks"]>>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [savingSubtaskId, setSavingSubtaskId] = useState<number | null>(null);
  const [subtaskStatuses, setSubtaskStatuses] = useState<SubtaskStatus[]>([]);

  const loadSubtasks = async (taskId: number): Promise<void> => {
    setIsLoadingSubtasks(true);

    try {
      const fetchedSubtasks = await getSubtasksByTask(taskId);
      setSubtasks(Array.isArray(fetchedSubtasks) ? fetchedSubtasks : []);
    } catch (error) {
      console.warn(
        `Failed to load subtasks for task ${taskId}:`,
        getSafeErrorMessage(error),
      );
      setSubtasks([]);
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    if (!visible || !task) {
      setIsEditing(false);
      setIsSavingEdit(false);
      setIsDeletingTask(false);
      setEditableName("");
      setEditableDescription("");
      return;
    }

    setEditableName(task.name ?? "");
    setEditableDescription(task.description ?? "");
  }, [task, visible]);

  useEffect(() => {
    let isActive = true;

    if (!visible) {
      return () => {
        isActive = false;
      };
    }

    void (async () => {
      try {
        const statuses = await getSubtaskStatuses();
        if (!isActive) {
          return;
        }

        setSubtaskStatuses(Array.isArray(statuses) ? statuses : []);
      } catch (error) {
        console.warn("Failed to load subtask statuses:", getSafeErrorMessage(error));
        if (isActive) {
          setSubtaskStatuses([]);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !task?.id) {
      setSubtasks([]);
      setIsLoadingSubtasks(false);
      return;
    }

    setSubtasks([]);
    void loadSubtasks(task.id);
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

  const handleSaveEdit = async () => {
    if (!task || !onEditTask) {
      setIsEditing(false);
      return;
    }

    const trimmedName = editableName.trim();
    const trimmedDescription = editableDescription.trim();

    if (!trimmedName) {
      Alert.alert("Validation", "Task name is required.");
      return;
    }

    try {
      setIsSavingEdit(true);
      await onEditTask(task, {
        name: trimmedName,
        description: trimmedDescription || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", getSafeErrorMessage(error));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePress = () => {
    if (!task || !onDeleteTask) {
      return;
    }

    Alert.alert(
      "Delete Task",
      "This will permanently delete this task and all related subtasks. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setIsDeletingTask(true);
                await onDeleteTask(task);
              } catch (error) {
                Alert.alert("Error", getSafeErrorMessage(error));
              } finally {
                setIsDeletingTask(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleEditSubtask = async (
    subtask: HomeSubtask,
    updates: {
      name: string;
      description?: string;
      taskOrder?: number;
      startTime?: string;
      endTime?: string;
      completed?: boolean;
      statusId?: number;
      statusName?: string;
    },
  ) => {
    if (!task?.id) {
      return;
    }

    const trimmedName = updates.name.trim();
    if (!trimmedName) {
      throw new Error("Subtask name is required.");
    }

    setSavingSubtaskId(subtask.id);
    try {
      await patchSubtask(subtask.id, {
        name: trimmedName,
        description: updates.description,
        taskOrder: updates.taskOrder,
        startTime: updates.startTime,
        endTime: updates.endTime,
        duration: subtask.duration,
        estimatedTime: subtask.estimatedTime,
        completed: updates.completed,
        status:
          typeof updates.statusId === "number"
            ? { id: updates.statusId, name: updates.statusName ?? "" }
            : subtask.status,
      });
      await loadSubtasks(task.id);
    } finally {
      setSavingSubtaskId(null);
    }
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
            <View style={styles.taskQueueModalTitleContainer}>
              <Text
                style={styles.taskQueueModalTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {!task ? "Task Queue" : task.name}
              </Text>
            </View>
            <View style={styles.taskQueueHeaderActions}>
              {task && (
                <TouchableOpacity
                  style={styles.taskQueueHeaderIconButton}
                  onPress={() => {
                    if (isEditing) {
                      void handleSaveEdit();
                      return;
                    }

                    setIsEditing(true);
                  }}
                  disabled={isSavingEdit || isDeletingTask}
                >
                  <Ionicons
                    name={isEditing ? "checkmark" : "pencil"}
                    size={18}
                    color="#70E1FF"
                  />
                </TouchableOpacity>
              )}
              {task && (
                <TouchableOpacity
                  style={styles.taskQueueHeaderIconButton}
                  onPress={handleDeletePress}
                  disabled={isSavingEdit || isDeletingTask || isEditing}
                >
                  <Ionicons name="trash" size={18} color="#FF8A80" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.taskQueueHeaderIconButton}
                onPress={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditableName(task?.name ?? "");
                    setEditableDescription(task?.description ?? "");
                    return;
                  }

                  onClose();
                }}
                disabled={isSavingEdit || isDeletingTask}
              >
                <Ionicons name="close" size={22} color="#E5F7FF" />
              </TouchableOpacity>
            </View>
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
                  <Text style={styles.taskQueueFieldLabel}>Task Name</Text>
                  {isEditing ? (
                    <TextInput
                      value={editableName}
                      onChangeText={setEditableName}
                      style={styles.taskQueueEditableInput}
                      placeholder="Task name"
                      placeholderTextColor="#6F8A97"
                      editable={!isSavingEdit}
                    />
                  ) : (
                    <Text style={styles.taskQueueFieldValue}>{task.name}</Text>
                  )}
                </View>

                <View style={styles.taskQueueFieldRow}>
                  <Text style={styles.taskQueueFieldLabel}>Description</Text>
                  {isEditing ? (
                    <TextInput
                      value={editableDescription}
                      onChangeText={setEditableDescription}
                      style={[styles.taskQueueEditableInput, styles.taskQueueEditableMultilineInput]}
                      placeholder="Description"
                      placeholderTextColor="#6F8A97"
                      multiline
                      textAlignVertical="top"
                      editable={!isSavingEdit}
                    />
                  ) : (
                    <Text style={styles.taskQueueFieldValue}>{task.description}</Text>
                  )}
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
                        onEditSubtask={handleEditSubtask}
                        isSaving={savingSubtaskId === subtask.id}
                        statusOptions={subtaskStatuses}
                      />
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}

          {(isSavingEdit || isDeletingTask) && (
            <View style={styles.taskQueueUpdatingOverlay}>
              <ActivityIndicator size="large" color="#70E1FF" />
              <Text style={styles.taskQueueUpdatingText}>
                {isDeletingTask ? "Deleting task..." : "Updating task..."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
