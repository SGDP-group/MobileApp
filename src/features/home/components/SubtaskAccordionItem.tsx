import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "./../../calendar/styles/taskQueueModalCalender.styles";
import {
  getStatusLabel,
   getStatusLabelStatus,
  type HomeSubtask,
  type SubtaskStatus
} from "./../../calendar/utils/taskQueueModalCalender.utils";

import { formatDateTimeForDisplay, normalizeId, normalizeName, toDate } from "./../../calendar/utils/editableSubtaskAccordionItem.utils";

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
  onDeleteSubtask?: (subtask: HomeSubtask) => Promise<void> | void;
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
  onDeleteSubtask,
  isSaving = false,
  statusOptions = [],
}: SubtaskAccordionItemProps) {

  
 
  
  const [editableStartTime, setEditableStartTime] = useState(subtask.startTime ?? "");
  const [editableEndTime, setEditableEndTime] = useState(subtask.endTime ?? "");
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

  

  const statusLabel =  getStatusLabelStatus( subtask.statusName);
    
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

  const completedLabel = getStatusLabelStatus(subtask.statusName);
  const fallbackStatusOption =
    selectedStatusOption ||
    resolvedStatusOptions.find(
      (option) => normalizeName(option.name)?.includes(completedLabel),
    ) ||
    resolvedStatusOptions[0];

  useEffect(() => {
    if ( selectedStatusOption || !fallbackStatusOption) {
      return;
    }

    const fallbackId = normalizeId(fallbackStatusOption.id);
    const numericFallbackId =
      fallbackId !== undefined && fallbackId.length > 0
        ? Number.parseInt(fallbackId, 10)
        : Number.NaN;

    setEditableStatusId(Number.isNaN(numericFallbackId) ? undefined : numericFallbackId);
    setEditableStatusName(fallbackStatusOption.name);
  }, [fallbackStatusOption,  selectedStatusOption]);

 

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
          {(
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
        
          <TouchableOpacity
            style={styles.subtaskHeaderIconButton}
            onPress={() => { onToggle(subtask.id); }}
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

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Description</Text>
           <Text style={styles.taskQueueFieldValue}>{subtask.description?.trim() || "No description"}</Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Start Time</Text>
              <Text style={styles.taskQueueFieldValue}>{formatDateTimeForDisplay(subtask.startTime)}</Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>End Time</Text>
            <Text style={styles.taskQueueFieldValue}>
              {editableEndTime? formatDateTimeForDisplay(editableEndTime): "End Date & Time"}
              </Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Task Order</Text>
              <Text style={styles.taskQueueFieldValue}>
                {typeof subtask.taskOrder === "number" ? subtask.taskOrder : "Not set"}
              </Text>
          </View>

          <View style={styles.taskQueueFieldRow}>
            <Text style={styles.taskQueueFieldLabel}>Status</Text>
           
              <View style={styles.subtaskStatusOptionsRow}>
                {resolvedStatusOptions.map((option) => {
                  const isSelected =
                    normalizeId(option.id) === normalizeId(editableStatusId) ||
                    normalizeName(option.name) === normalizeName(editableStatusName) ||
                    (selectedStatusOption === undefined && option === fallbackStatusOption);

                  return (
                      <Text
                        style={[
                          styles.subtaskStatusOptionText,
                          isSelected && styles.subtaskStatusOptionTextActive,
                        ]}
                      >
                        {option.name ?? `Status ${option.id}`}
                      </Text>
                  );
                })}
                {resolvedStatusOptions.length === 0 && (
                  <Text style={styles.taskQueueFieldValue}>No status options found</Text>
                )}
              </View>
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
