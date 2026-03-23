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

  const normalizeStatusName = (value?: string): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
  };

  const loadSubtasks = async (taskId: number): Promise<void> => {
    setIsLoadingSubtasks(true);

    try {
      const fetchedSubtasks = await getSubtasksByTask(taskId);
      const normalizedSubtasks = Array.isArray(fetchedSubtasks)
        ? fetchedSubtasks.map((subtask) => {
          const rawSubtask = subtask as HomeSubtask & {
            status?: { id?: number; name?: string };
            status_id?: number;
            status_name?: string;
            StatusId?: number;
            StatusName?: string;
          };

          return {
            ...rawSubtask,
            statusId:
              rawSubtask.statusId ??
              rawSubtask.status?.id ??
              rawSubtask.status_id ??
              rawSubtask.StatusId,
            statusName:
              rawSubtask.statusName ??
              rawSubtask.status?.name ??
              rawSubtask.status_name ??
              rawSubtask.StatusName,
          };
        })
        : [];

      setSubtasks(normalizedSubtasks);
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

        const normalizedStatuses: SubtaskStatus[] = Array.isArray(statuses)
          ? statuses.map((status) => {
            const rawStatus = status as {
              id?: number;
              name?: string;
              StatusId?: number;
              StatusName?: string;
            };

            return {
              id: rawStatus.id ?? rawStatus.StatusId,
              name: rawStatus.name ?? rawStatus.StatusName,
            };
          })
          : [];

        setSubtaskStatuses(normalizedStatuses);
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

  const normalizedSubtasks = useMemo(() => {
    if (subtasks.length === 0) {
      return [];
    }

    const statusIdByName = new Map<string, number>();
    const statusNameById = new Map<number, string>();

    subtaskStatuses.forEach((status) => {
      if (typeof status.id !== "number") {
        return;
      }

      if (typeof status.name === "string") {
        const normalizedName = normalizeStatusName(status.name);
        if (normalizedName) {
          statusIdByName.set(normalizedName, status.id);
        }

        statusNameById.set(status.id, status.name);
      }
    });

    return subtasks.map((subtask) => {
      const normalizedName = normalizeStatusName(subtask.statusName);
      const resolvedStatusId =
        typeof subtask.statusId === "number"
          ? subtask.statusId
          : normalizedName
            ? statusIdByName.get(normalizedName)
            : undefined;

      const resolvedStatusName =
        subtask.statusName ??
        (typeof resolvedStatusId === "number"
          ? statusNameById.get(resolvedStatusId)
          : undefined);

      return {
        ...subtask,
        statusId: resolvedStatusId ?? subtask.statusId ?? 0,
        statusName: resolvedStatusName ?? subtask.statusName ?? "",
      };
    });
  }, [subtaskStatuses, subtasks]);

  useEffect(() => {
    if (!visible || normalizedSubtasks.length === 0) {
      setExpandedSubtaskIds([]);
      return;
    }

    setExpandedSubtaskIds(normalizedSubtasks.map((subtask) => subtask.id));
  }, [normalizedSubtasks, visible]);

  const sortedSubtasks = useMemo(() => {
    if (normalizedSubtasks.length === 0) {
      return [];
    }

    return [...normalizedSubtasks]
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
  }, [normalizedSubtasks]);


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
      let googleEventId = subtask.googleEventId;
      const hasTimes = updates.startTime && updates.endTime;
      if (hasTimes) {
        try {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
          const { googleCalendarService } = await import("@services/googleCalendarService");
          if (googleEventId) {
            // Update existing event
            await googleCalendarService.updateEvent(googleEventId, {
              summary: trimmedName,
              description: updates.description || "",
              start: updates.startTime ? { dateTime: updates.startTime, timeZone } : undefined,
              end: updates.endTime ? { dateTime: updates.endTime, timeZone } : undefined,

            });
          } else {
            // Create new event
            const event = await googleCalendarService.createEvent({
              summary: trimmedName,
              description: updates.description || "",
              start: {
                dateTime: updates.startTime,
                timeZone: timeZone,
              },
              end: {
                dateTime: updates.endTime,
                timeZone: timeZone,
              },
            });
            googleEventId = event?.id;
          }
        } catch (calendarError) {
          console.warn("Failed to sync Google Calendar event for subtask", subtask.name, calendarError);
        }
      } else if (googleEventId && (!updates.startTime || !updates.endTime)) {
        // If times are removed, delete the event
        try {
          const { googleCalendarService } = await import("@services/googleCalendarService");
          await googleCalendarService.deleteEvent(googleEventId);
          googleEventId = undefined;
        } catch (calendarError) {
          console.warn("Failed to delete Google Calendar event for subtask", subtask.name, calendarError);
        }
      }

      await patchSubtask(subtask.id, {
        name: trimmedName,
        description: updates.description,
        taskOrder: updates.taskOrder,
        startTime: updates.startTime,
        endTime: updates.endTime,
        duration: subtask.duration,
        estimatedTime: subtask.estimatedTime,
        completed: updates.completed,
        statusId:
          typeof updates.statusId === "number"
            ? updates.statusId
            : typeof subtask.statusId === "number"
              ? subtask.statusId
              : undefined,
        googleEventId,
      });
      await loadSubtasks(task.id);
    } finally {
      setSavingSubtaskId(null);
    }
  };

  const isUpdatingSubtask = savingSubtaskId !== null;

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
                  disabled={isSavingEdit || isDeletingTask || isUpdatingSubtask}
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
                  disabled={isSavingEdit || isDeletingTask || isEditing || isUpdatingSubtask}
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
                disabled={isSavingEdit || isDeletingTask || isUpdatingSubtask}
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

          {(isSavingEdit || isDeletingTask || isUpdatingSubtask) && (
            <View style={styles.taskQueueUpdatingOverlay}>
              <ActivityIndicator size="large" color="#70E1FF" />
              <Text style={styles.taskQueueUpdatingText}>
                {isDeletingTask
                  ? "Deleting task..."
                  : isUpdatingSubtask
                    ? "Updating subtask..."
                    : "Updating task..."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
