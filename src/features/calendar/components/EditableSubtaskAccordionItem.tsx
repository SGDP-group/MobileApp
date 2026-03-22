import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/taskQueueModalCalender.styles";
import {
  getStatusLabel,
  type HomeSubtask,
  type SubtaskStatus
} from "../utils/taskQueueModalCalender.utils";

interface SubtaskAccordionItemProps {
  subtask: HomeSubtask;
  isExpanded: boolean;
  onToggle: (subtaskId: number) => void;
  onEditSubtask?: (
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
  ) => Promise<void> | void;
  isSaving?: boolean;
  statusOptions?: SubtaskStatus[];
}

type SubtaskPickerState = {
  field: "startTime" | "endTime";
  mode: "date" | "time";
};

export function SubtaskAccordionItem({
  subtask,
  isExpanded,
  onToggle,
  onEditSubtask,
  isSaving = false,
  statusOptions = [],
}: SubtaskAccordionItemProps) {
  const toDate = (value?: string): Date | null => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed);
    const normalizedInput = hasTimezone ? trimmed : `${trimmed}Z`;
    const parsed = new Date(normalizedInput);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value: Date): string => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (value: Date): string => {
    const hours = `${value.getHours()}`.padStart(2, "0");
    const minutes = `${value.getMinutes()}`.padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDateTimeForDisplay = (value?: string): string => {
    const date = toDate(value);
    if (!date) {
      return "Not set";
    }

    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const normalizeId = (value: unknown): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    return String(value).trim();
  };

  const normalizeName = (value: unknown): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(subtask.name ?? "");
  const [editableDescription, setEditableDescription] = useState(subtask.description ?? "");
  const [editableTaskOrder, setEditableTaskOrder] = useState(
    typeof subtask.taskOrder === "number" ? String(subtask.taskOrder) : "",
  );
  const [editableStartTime, setEditableStartTime] = useState(subtask.startTime ?? "");
  const [editableEndTime, setEditableEndTime] = useState(subtask.endTime ?? "");
  const [editableCompleted, setEditableCompleted] = useState(Boolean(subtask.completed));
  const [editableStatusId, setEditableStatusId] = useState<number | undefined>(
    subtask.statusId,
  );
  const [editableStatusName, setEditableStatusName] = useState<string | undefined>(
    subtask.statusName,
  );
  const [activeDateTimePicker, setActiveDateTimePicker] = useState<SubtaskPickerState | null>(
    null,
  );
  const [pendingDateTime, setPendingDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setIsEditing(false);
    setEditableName(subtask.name ?? "");
    setEditableDescription(subtask.description ?? "");
    setEditableTaskOrder(
      typeof subtask.taskOrder === "number" ? String(subtask.taskOrder) : "",
    );
    setEditableStartTime(subtask.startTime ?? "");
    setEditableEndTime(subtask.endTime ?? "");
    setEditableCompleted(Boolean(subtask.completed));
    setEditableStatusId(subtask.statusId);
    setEditableStatusName(subtask.statusName);
    setActiveDateTimePicker(null);
    setPendingDateTime(null);
  }, [
    subtask.completed,
    subtask.description,
    subtask.endTime,
    subtask.id,
    subtask.name,
    subtask.startTime,
    subtask.statusName,
    subtask.statusId,
    subtask.taskOrder,
  ]);

  const statusLabel = getStatusLabel(isEditing ? editableCompleted : subtask.completed);
  const normalizedStatusOptions = statusOptions.map((option) => {
    const rawOption = option as SubtaskStatus & {
      statusId?: number | string;
      statusName?: string;
      label?: string;
      value?: number | string;
    };

    return {
      id: option.id ?? rawOption.statusId ?? rawOption.value,
      name: option.name ?? rawOption.statusName ?? rawOption.label,
    };
  });

  const currentStatusOption =
    subtask.statusId !== undefined || subtask.statusName !== undefined
      ? [{ id: subtask.statusId, name: subtask.statusName ?? "Current" }]
      : [];
  const resolvedStatusOptions = [...normalizedStatusOptions];
  currentStatusOption.forEach((currentOption) => {
    const exists = resolvedStatusOptions.some(
      (option) =>
        normalizeId(option.id) === normalizeId(currentOption.id) ||
        normalizeName(option.name) === normalizeName(currentOption.name),
    );

    if (!exists) {
      resolvedStatusOptions.push(currentOption);
    }
  });

  const selectedStatusOption = resolvedStatusOptions.find(
    (option) =>
      normalizeId(option.id) === normalizeId(editableStatusId) ||
      normalizeName(option.name) === normalizeName(editableStatusName),
  );

  const completedLabel = editableCompleted ? "completed" : "pending";
  const fallbackStatusOption =
    selectedStatusOption ||
    resolvedStatusOptions.find(
      (option) => normalizeName(option.name)?.includes(completedLabel),
    ) ||
    resolvedStatusOptions[0];

  useEffect(() => {
    if (!isEditing || selectedStatusOption || !fallbackStatusOption) {
      return;
    }

    const fallbackId = normalizeId(fallbackStatusOption.id);
    const numericFallbackId =
      fallbackId !== undefined && fallbackId.length > 0
        ? Number.parseInt(fallbackId, 10)
        : Number.NaN;

    setEditableStatusId(Number.isNaN(numericFallbackId) ? undefined : numericFallbackId);
    setEditableStatusName(fallbackStatusOption.name);
  }, [fallbackStatusOption, isEditing, selectedStatusOption]);

  const handleSave = async () => {
    if (!onEditSubtask) {
      setIsEditing(false);
      return;
    }

    const trimmedName = editableName.trim();
    const trimmedDescription = editableDescription.trim();
    const trimmedTaskOrder = editableTaskOrder.trim();
    const trimmedStartTime = editableStartTime.trim();
    const trimmedEndTime = editableEndTime.trim();

    if (!trimmedName) {
      Alert.alert("Validation", "Subtask name is required.");
      return;
    }

    const parsedTaskOrder =
      trimmedTaskOrder.length > 0 ? Number.parseInt(trimmedTaskOrder, 10) : undefined;

    if (parsedTaskOrder !== undefined && Number.isNaN(parsedTaskOrder)) {
      Alert.alert("Validation", "Task order must be a number.");
      return;
    }

    try {
      const selectedStatus = selectedStatusOption || fallbackStatusOption;

      await onEditSubtask(subtask, {
        name: trimmedName,
        description: trimmedDescription || undefined,
        taskOrder: parsedTaskOrder,
        startTime: trimmedStartTime || undefined,
        endTime: trimmedEndTime || undefined,
        completed: editableCompleted,
        statusId: editableStatusId,
        statusName: selectedStatus?.name,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update subtask.",
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableName(subtask.name ?? "");
    setEditableDescription(subtask.description ?? "");
    setEditableTaskOrder(
      typeof subtask.taskOrder === "number" ? String(subtask.taskOrder) : "",
    );
    setEditableStartTime(subtask.startTime ?? "");
    setEditableEndTime(subtask.endTime ?? "");
    setEditableCompleted(Boolean(subtask.completed));
    setEditableStatusId(subtask.statusId);
    setEditableStatusName(subtask.statusName);
    setActiveDateTimePicker(null);
    setPendingDateTime(null);
  };

  const openDateTimePicker = (field: "startTime" | "endTime") => {
    const currentValue =
      field === "startTime" ? editableStartTime : editableEndTime;

    setPendingDateTime(toDate(currentValue) ?? new Date());
    setActiveDateTimePicker({ field, mode: "date" });
  };

  const handleDateTimeChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date,
  ) => {
    if (!activeDateTimePicker || event.type !== "set" || !selectedValue) {
      setActiveDateTimePicker(null);
      setPendingDateTime(null);
      return;
    }

    if (activeDateTimePicker.mode === "date") {
      const currentValue =
        pendingDateTime ??
        toDate(
          activeDateTimePicker.field === "startTime"
            ? editableStartTime
            : editableEndTime,
        ) ??
        new Date();

      const next = new Date(selectedValue);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);

      setPendingDateTime(next);
      setActiveDateTimePicker({ ...activeDateTimePicker, mode: "time" });
      return;
    }

    const dateValue =
      pendingDateTime ??
      toDate(
        activeDateTimePicker.field === "startTime"
          ? editableStartTime
          : editableEndTime,
      ) ??
      new Date();

    const next = new Date(dateValue);
    next.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);

    if (activeDateTimePicker.field === "startTime") {
      setEditableStartTime(next.toISOString());
    } else {
      setEditableEndTime(next.toISOString());
    }

    setActiveDateTimePicker(null);
    setPendingDateTime(null);
  };

  return (
    <View style={styles.subtaskAccordionCard}>
      <View style={styles.subtaskAccordionHeader}>
        <View style={styles.subtaskAccordionTitleWrap}>
          <Text style={styles.subtaskOrderBadge}>#{subtask.taskOrder ?? "-"}</Text>
          <Text style={styles.subtaskAccordionTitle} numberOfLines={1}>
            {subtask.name}
          </Text>
        </View>
        <View style={styles.subtaskHeaderRight}>
          {!isEditing && (
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
          )}
          {isExpanded && (isEditing ? (
            <>
              <TouchableOpacity
                style={styles.subtaskHeaderIconButton}
                onPress={() => {
                  void handleSave();
                }}
                disabled={isSaving}
              >
                <Ionicons name="checkmark" size={16} color="#70E1FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.subtaskHeaderIconButton}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Ionicons name="close" size={16} color="#E5F7FF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.subtaskHeaderIconButton}
              onPress={() => setIsEditing(true)}
              disabled={isSaving}
            >
              <Ionicons name="pencil" size={14} color="#70E1FF" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.subtaskHeaderIconButton}
            onPress={() => {
              if (isExpanded && isEditing) {
                handleCancel();
              }
              onToggle(subtask.id);
            }}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#70E1FF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.subtaskAccordionBody}>
          {isEditing && (
            <View style={styles.taskQueueFieldRow}>
              <Text style={styles.taskQueueFieldLabel}>Subtask</Text>
              <TextInput
                value={editableName}
                onChangeText={setEditableName}
                style={styles.taskQueueEditableInput}
                placeholder="Subtask name"
                placeholderTextColor="#6F8A97"
                editable={!isSaving}
              />
            </View>
          )}

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
                editable={!isSaving}
              />
            ) : (
              <Text style={styles.taskQueueFieldValue}>
                {subtask.description?.trim() || "No description"}
              </Text>
            )}
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Start Time</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[
                  styles.taskQueueEditableInput,
                  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                ]}
                onPress={() => openDateTimePicker("startTime")}
                disabled={isSaving}
              >
                <Text style={styles.taskQueueFieldValue}>
                  {editableStartTime
                    ? formatDateTimeForDisplay(editableStartTime)
                    : "Start Date & Time"}
                </Text>
                <Ionicons name="time-outline" size={16} color="#E5F7FF" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.taskQueueFieldValue}>
                {formatDateTimeForDisplay(subtask.startTime)}
              </Text>
            )}
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>End Time</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[
                  styles.taskQueueEditableInput,
                  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                ]}
                onPress={() => openDateTimePicker("endTime")}
                disabled={isSaving}
              >
                <Text style={styles.taskQueueFieldValue}>
                  {editableEndTime
                    ? formatDateTimeForDisplay(editableEndTime)
                    : "End Date & Time"}
                </Text>
                <Ionicons name="time-outline" size={16} color="#E5F7FF" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.taskQueueFieldValue}>
                {formatDateTimeForDisplay(subtask.endTime)}
              </Text>
            )}
          </View>

          {isEditing && activeDateTimePicker ? (
            <DateTimePicker
              value={
                pendingDateTime ??
                toDate(
                  activeDateTimePicker.field === "startTime"
                    ? editableStartTime
                    : editableEndTime,
                ) ??
                new Date()
              }
              mode={activeDateTimePicker.mode}
              is24Hour
              display="default"
              onChange={handleDateTimeChange}
            />
          ) : null}

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Task Order</Text>
            {isEditing ? (
              <TextInput
                value={editableTaskOrder}
                onChangeText={setEditableTaskOrder}
                style={styles.taskQueueEditableInput}
                placeholder="Task order"
                placeholderTextColor="#6F8A97"
                keyboardType="numeric"
                editable={!isSaving}
              />
            ) : (
              <Text style={styles.taskQueueFieldValue}>
                {typeof subtask.taskOrder === "number" ? subtask.taskOrder : "Not set"}
              </Text>
            )}
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Status</Text>
            {isEditing ? (
              <View style={styles.subtaskStatusOptionsRow}>
                {resolvedStatusOptions.map((option) => {
                  const isSelected =
                    normalizeId(option.id) === normalizeId(editableStatusId) ||
                    normalizeName(option.name) === normalizeName(editableStatusName) ||
                    (selectedStatusOption === undefined && option === fallbackStatusOption);

                  return (
                    <TouchableOpacity
                      key={`${normalizeId(option.id) ?? "status"}-${normalizeName(option.name) ?? "unknown"}`}
                      style={[
                        styles.subtaskStatusOptionButton,
                        isSelected && styles.subtaskStatusOptionButtonActive,
                      ]}
                      onPress={() => {
                        const normalizedOptionId = normalizeId(option.id);
                        const numericOptionId =
                          normalizedOptionId !== undefined && normalizedOptionId.length > 0
                            ? Number.parseInt(normalizedOptionId, 10)
                            : Number.NaN;

                        setEditableStatusId(Number.isNaN(numericOptionId) ? undefined : numericOptionId);
                        setEditableStatusName(option.name);
                      }}
                      disabled={isSaving}
                    >
                      <Text
                        style={[
                          styles.subtaskStatusOptionText,
                          isSelected && styles.subtaskStatusOptionTextActive,
                        ]}
                      >
                        {option.name ?? `Status ${option.id}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {resolvedStatusOptions.length === 0 && (
                  <Text style={styles.taskQueueFieldValue}>No status options found</Text>
                )}
              </View>
            ) : (
              <View style={styles.subtaskCompleteToggleRow}>
                <Text style={styles.taskQueueFieldValue}>
                  {subtask.statusName }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Complete</Text>
            {isEditing ? (
              <View style={styles.subtaskCompleteToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.subtaskCompleteToggleButton,
                    editableCompleted && styles.subtaskCompleteToggleButtonActive,
                  ]}
                  onPress={() => setEditableCompleted(true)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.subtaskCompleteToggleText,
                      editableCompleted && styles.subtaskCompleteToggleTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.subtaskCompleteToggleButton,
                    !editableCompleted && styles.subtaskCompleteToggleButtonActive,
                  ]}
                  onPress={() => setEditableCompleted(false)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.subtaskCompleteToggleText,
                      !editableCompleted && styles.subtaskCompleteToggleTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.taskQueueFieldValue}>
                {subtask.completed ? "Yes" : "No"}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
