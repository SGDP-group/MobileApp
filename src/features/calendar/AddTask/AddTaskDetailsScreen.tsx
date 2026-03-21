import type { CreateSubtaskPayload } from "@/src/types/type";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { createSubtask as createFocusFrameSubtask } from "@services/focusFrameSubtaskService";
import { createTask as createFocusFrameTask } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { googleCalendarService } from "@services/googleCalendarService";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles/addTaskDetails.styles";

type SubtaskDraft = {
  name: string;
  description: string;
  startTime: Date | null;
  endTime: Date | null;
};

type SubtaskPickerState = {
  index: number;
  field: "startTime" | "endTime";
  mode: "date" | "time";
};

const getDeviceTimeZone = (): string => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone && timezone.trim().length > 0 ? timezone : "UTC";
};

const TIMEZONE = getDeviceTimeZone();

const toTwoDigits = (value: number): string => `${value}`.padStart(2, "0");

const toLocalApiDateTime = (value: Date): string => {
  const year = value.getFullYear();
  const month = toTwoDigits(value.getMonth() + 1);
  const day = toTwoDigits(value.getDate());
  const hours = toTwoDigits(value.getHours());
  const minutes = toTwoDigits(value.getMinutes());
  const seconds = toTwoDigits(value.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const toOffsetDateTime = (value: Date): string => {
  const localDateTime = toLocalApiDateTime(value);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const hours = toTwoDigits(Math.floor(absOffsetMinutes / 60));
  const minutes = toTwoDigits(absOffsetMinutes % 60);

  return `${localDateTime}${sign}${hours}:${minutes}`;
};

const VALIDATION_ERRORS = {
  MISSING_TASK_NAME: {
    title: "Missing Task Name",
    message: "Please enter a task name.",
  },
  MISSING_SUBTASKS: {
    title: "Missing Subtasks",
    message: "Please add at least one subtask with a name.",
  },
  MISSING_START_TIME: (index: number) => ({
    title: "Missing Start Date/Time",
    message: `Sub Task ${index}: Please set a start date and time.`,
  }),
  MISSING_END_TIME: (index: number) => ({
    title: "Missing End Date/Time",
    message: `Sub Task ${index}: Please set an end date and time.`,
  }),
  INVALID_SUBTASK_DATES: (index: number) => ({
    title: "Invalid Subtask Dates",
    message: `Sub Task ${index}: Start date/time must be before end date/time.`,
  }),
  USER_NOT_LINKED: {
    title: "User Not Linked",
    message: "Please sign in again before creating a task.",
  },
  AUTH_REQUIRED: {
    title: "Authentication Required",
    message: "Please sign in again to get your email for task creation.",
  },
  SUBTASK_CREATION_FAILED: {
    title: "Task Created with Warnings",
    message: "Main task was created, but one or more subtasks failed to save.",
  },
  TASK_CREATION_FAILED: {
    title: "Error",
    message: "Failed to create task. Please try again.",
  },
};

const SUCCESS_MESSAGES = {
  TASK_CREATED: {
    title: "Task Created",
    message: "Task was added successfully.",
  },
  TASK_CREATED_CALENDAR_FAILED: {
    title: "Task Created with Issues",
    message:
      "Task was created successfully, but some calendar events could not be synced. Your calendar may be out of sync.",
  },
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

const formatDateTime = (value: Date): string =>
  `${formatDate(value)} ${formatTime(value)}`;

const getEmptySubtask = (): SubtaskDraft => ({
  name: "",
  description: "",
  startTime: null,
  endTime: null,
});

const getTodayMinDate = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function AddTaskDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([getEmptySubtask()]);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<
    Record<number, boolean>
  >({});
  const [activeSubtaskDateTimePicker, setActiveSubtaskDateTimePicker] =
    useState<SubtaskPickerState | null>(null);
  const [pendingSubtaskDateTime, setPendingSubtaskDateTime] =
    useState<Date | null>(null);

  const todayMinDate = useMemo(() => getTodayMinDate(), []);

  const validSubtasks = useMemo(
    () =>
      subtasks
        .map((subtask, originalIndex) => ({
          originalIndex,
          name: subtask.name.trim(),
          description: subtask.description.trim(),
          startTime: subtask.startTime,
          endTime: subtask.endTime,
        }))
        .filter((subtask) => subtask.name.length > 0),
    [subtasks],
  );

  const updateSubtaskTextField = (
    index: number,
    field: "name" | "description",
    value: string,
  ) => {
    setSubtasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const updateSubtaskTimeField = (
    index: number,
    field: "startTime" | "endTime",
    value: Date,
  ) => {
    setSubtasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addSubtask = () => {
    const newIndex = subtasks.length;
    setSubtasks((prev) => [...prev, getEmptySubtask()]);
    setCollapsedSubtasks((prev) => ({ ...prev, [newIndex]: false }));
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [getEmptySubtask()];
    });

    setCollapsedSubtasks((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (idx < index) {
          next[idx] = value;
        } else if (idx > index) {
          next[idx - 1] = value;
        }
      });
      return next;
    });

    setActiveSubtaskDateTimePicker((prev) => {
      if (!prev) return null;
      if (prev.index === index) return null;
      if (prev.index > index) {
        return { ...prev, index: prev.index - 1 };
      }
      return prev;
    });
  };

  const toggleSubtaskCollapse = (index: number) => {
    setCollapsedSubtasks((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  };

  const validateTaskName = (title: string): boolean => {
    if (!title.trim()) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_TASK_NAME.title,
        VALIDATION_ERRORS.MISSING_TASK_NAME.message,
      );
      return false;
    }
    return true;
  };

  const validateSubtasksExist = (): boolean => {
    if (validSubtasks.length === 0) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_SUBTASKS.title,
        VALIDATION_ERRORS.MISSING_SUBTASKS.message,
      );
      return false;
    }
    return true;
  };

  const validateSubtaskDateTime = (): boolean => {
    for (let i = 0; i < validSubtasks.length; i++) {
      const subtask = validSubtasks[i];
      const subtaskNumber = subtask.originalIndex + 1;

      if (!subtask.startTime) {
        const error = VALIDATION_ERRORS.MISSING_START_TIME(subtaskNumber);
        Alert.alert(error.title, error.message);
        return false;
      }

      if (!subtask.endTime) {
        const error = VALIDATION_ERRORS.MISSING_END_TIME(subtaskNumber);
        Alert.alert(error.title, error.message);
        return false;
      }

      if (subtask.startTime >= subtask.endTime) {
        const error = VALIDATION_ERRORS.INVALID_SUBTASK_DATES(subtaskNumber);
        Alert.alert(error.title, error.message);
        return false;
      }
    }
    return true;
  };

  const validateAllInputs = (): boolean =>
    validateTaskName(taskName) &&
    validateSubtasksExist() &&
    validateSubtaskDateTime();

  const createSubtaskPayload = (
    createdTaskId: number,
  ): CreateSubtaskPayload[] => {
    return validSubtasks.map((subtask, index) => {
      const subtaskStart = subtask.startTime!;
      const subtaskEnd = subtask.endTime!;
      const duration = Math.max(
        0,
        Math.round((subtaskEnd.getTime() - subtaskStart.getTime()) / 60000),
      );

      return {
        name: subtask.name,
        description: subtask.description || "",
        task: { id: createdTaskId },
        taskOrder: index + 1,
        startTime: toLocalApiDateTime(subtaskStart),
        endTime: toLocalApiDateTime(subtaskEnd),
        duration,
      };
    });
  };

  const handleAuthError = async (): Promise<string | null> => {
    const signedInUser = await GoogleSignin.getCurrentUser();
    if (!signedInUser?.user?.email) {
      Alert.alert(
        VALIDATION_ERRORS.AUTH_REQUIRED.title,
        VALIDATION_ERRORS.AUTH_REQUIRED.message,
        [
          {
            text: "Sign In",
            onPress: async () => {
              try {
                await GoogleSignin.signIn();
              } catch (error) {
                console.error("Sign-in error:", error);
              }
            },
          },
          { text: "Cancel", onPress: () => {} },
        ],
      );
      return null;
    }
    return signedInUser.user.email;
  };

  const createSubtaskCalendarEvents = async (): Promise<{
    success: boolean;
    failureCount: number;
  }> => {
    try {
      const calendarEventPromises = validSubtasks.map((subtask) => {
        if (!subtask.startTime || !subtask.endTime) return null;

        return googleCalendarService.createEvent({
          summary: subtask.name,
          description: subtask.description || "",
          start: {
            dateTime: toOffsetDateTime(subtask.startTime),
            timeZone: TIMEZONE,
          },
          end: {
            dateTime: toOffsetDateTime(subtask.endTime),
            timeZone: TIMEZONE,
          },
        });
      });

      const isPromise = (p: unknown): p is Promise<any> => p !== null;
      const nonNullPromises = calendarEventPromises.filter(isPromise);

      if (nonNullPromises.length === 0) {
        return { success: true, failureCount: 0 };
      }

      const results = await Promise.allSettled(nonNullPromises);
      const failures = results.filter((r) => r.status === "rejected");

      if (failures.length > 0) {
        console.warn(
          `Failed to create ${failures.length} calendar event(s):`,
          failures.map((f) => (f as PromiseRejectedResult).reason),
        );
        return { success: false, failureCount: failures.length };
      }

      return { success: true, failureCount: 0 };
    } catch (error) {
      console.error("Error creating calendar events:", error);
      return { success: false, failureCount: validSubtasks.length };
    }
  };

  const createSubtasks = async (
    createdTaskId: number,
  ): Promise<{ success: boolean; calendarFailureCount: number }> => {
    const payload = createSubtaskPayload(createdTaskId);

    if (payload.length === 0) return { success: true, calendarFailureCount: 0 };

    try {
      await Promise.all(
        payload.map((subtask) => createFocusFrameSubtask(subtask)),
      );

      const calendarResult = await createSubtaskCalendarEvents();

      return {
        success: true,
        calendarFailureCount: calendarResult.failureCount,
      };
    } catch (error) {
      console.error("Error creating subtasks:", error);
      Alert.alert(
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.title,
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.message,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return { success: false, calendarFailureCount: 0 };
    }
  };

  const handleSaveTask = async () => {
    if (!validateAllInputs()) return;

    try {
      setIsSaving(true);

      const userId = await getStoredUserId();
      if (!userId) {
        Alert.alert(
          VALIDATION_ERRORS.USER_NOT_LINKED.title,
          VALIDATION_ERRORS.USER_NOT_LINKED.message,
        );
        return;
      }

      const description = taskDescription.trim();
      const userEmail = await handleAuthError();
      if (!userEmail) return;

      const createdTask = await createFocusFrameTask({
        name: taskName.trim(),
        description,
        user: { id: userId, email: userEmail },
      });

      if (!createdTask?.id) {
        throw new Error("Task created without task id.");
      }

      const subtasksResult = await createSubtasks(createdTask.id);
      if (!subtasksResult.success) return;

      if (subtasksResult.calendarFailureCount > 0) {
        Alert.alert(
          SUCCESS_MESSAGES.TASK_CREATED_CALENDAR_FAILED.title,
          SUCCESS_MESSAGES.TASK_CREATED_CALENDAR_FAILED.message,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          SUCCESS_MESSAGES.TASK_CREATED.title,
          SUCCESS_MESSAGES.TASK_CREATED.message,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      }
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert(
        VALIDATION_ERRORS.TASK_CREATION_FAILED.title,
        VALIDATION_ERRORS.TASK_CREATION_FAILED.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubtaskDateTimeChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date,
  ) => {
    const pickerContext = activeSubtaskDateTimePicker;

    if (!pickerContext || event.type !== "set" || !selectedValue) {
      setActiveSubtaskDateTimePicker(null);
      setPendingSubtaskDateTime(null);
      return;
    }

    if (pickerContext.mode === "date") {
      const currentValue =
        pendingSubtaskDateTime ??
        subtasks[pickerContext.index]?.[pickerContext.field] ??
        new Date();
      const next = new Date(selectedValue);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);

      setPendingSubtaskDateTime(next);
      setActiveSubtaskDateTimePicker({ ...pickerContext, mode: "time" });
      return;
    }

    const dateValue =
      pendingSubtaskDateTime ??
      subtasks[pickerContext.index]?.[pickerContext.field] ??
      new Date();
    const next = new Date(dateValue);
    next.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);

    updateSubtaskTimeField(pickerContext.index, pickerContext.field, next);
    setActiveSubtaskDateTimePicker(null);
    setPendingSubtaskDateTime(null);
  };

  const getSubtaskDurationInMinutes = (
    subtask: SubtaskDraft,
  ): number | null => {
    if (!subtask.startTime || !subtask.endTime) return null;
    const diff = subtask.endTime.getTime() - subtask.startTime.getTime();
    if (diff <= 0) return null;
    return Math.round(diff / 60000);
  };

  const renderSubtaskContent = (subtask: SubtaskDraft, index: number) => (
    <View style={styles.subtaskContent}>
      <TextInput
        style={styles.input}
        value={subtask.name}
        onChangeText={(value) => updateSubtaskTextField(index, "name", value)}
        placeholder="Sub task name"
        placeholderTextColor={colors.secondaryText}
      />

      <TextInput
        style={[styles.input, styles.textArea, styles.subtaskDescriptionInput]}
        value={subtask.description}
        onChangeText={(value) =>
          updateSubtaskTextField(index, "description", value)
        }
        placeholder="Sub task description (optional)"
        placeholderTextColor={colors.secondaryText}
        multiline
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.input, styles.pickerInput, styles.timeInput]}
          onPress={() => {
            setPendingSubtaskDateTime(subtask.startTime ?? new Date());
            setActiveSubtaskDateTimePicker({
              index,
              field: "startTime",
              mode: "date",
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Set start date and time for sub task ${index + 1}`}
        >
          <Text style={styles.pickerInputText}>
            {subtask.startTime
              ? formatDateTime(subtask.startTime)
              : "Start Date & Time"}
          </Text>
          <Ionicons name="time-outline" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.input, styles.pickerInput, styles.timeInput]}
          onPress={() => {
            setPendingSubtaskDateTime(subtask.endTime ?? new Date());
            setActiveSubtaskDateTimePicker({
              index,
              field: "endTime",
              mode: "date",
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Set end date and time for sub task ${index + 1}`}
        >
          <Text style={styles.pickerInputText}>
            {subtask.endTime
              ? formatDateTime(subtask.endTime)
              : "End Date & Time"}
          </Text>
          <Ionicons name="time-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>
        Duration: {getSubtaskDurationInMinutes(subtask) ?? "--"} min
      </Text>
    </View>
  );

  const renderSubtaskCard = (subtask: SubtaskDraft, index: number) => {
    const isCollapsed = collapsedSubtasks[index] ?? false;

    return (
      <View key={`subtask-${index}`} style={styles.subtaskCard}>
        <View style={styles.subtaskHeader}>
          <View style={styles.subtaskTitleWrap}>
            <Text style={styles.subtaskOrderBadge}>{index + 1}</Text>
            <Text style={styles.subtaskTitle}>Sub Task</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{ marginRight: 10, padding: 2 }}
              onPress={() => toggleSubtaskCollapse(index)}
              accessibilityRole="button"
              accessibilityLabel={`${
                isCollapsed ? "Expand" : "Collapse"
              } sub task ${index + 1}`}
            >
              <Ionicons
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeSubtaskButton}
              onPress={() => removeSubtask(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove sub task ${index + 1}`}
            >
              <Text style={styles.removeSubtaskText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isCollapsed && renderSubtaskContent(subtask, index)}
      </View>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Task Details</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.divider} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Main Task Name *</Text>
          <TextInput
            style={styles.input}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="Enter task name"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Main Task Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={taskDescription}
            onChangeText={setTaskDescription}
            placeholder="Enter task description"
            placeholderTextColor={colors.secondaryText}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sub Tasks</Text>
          {subtasks.map((subtask, index) => renderSubtaskCard(subtask, index))}

          {activeSubtaskDateTimePicker ? (
            <DateTimePicker
              value={
                pendingSubtaskDateTime ??
                subtasks[activeSubtaskDateTimePicker.index]?.[
                  activeSubtaskDateTimePicker.field
                ] ??
                new Date()
              }
              mode={activeSubtaskDateTimePicker.mode}
              is24Hour
              display="default"
              minimumDate={
                activeSubtaskDateTimePicker.mode === "date"
                  ? todayMinDate
                  : undefined
              }
              onChange={handleSubtaskDateTimeChange}
            />
          ) : null}

          <TouchableOpacity
            style={styles.addSubtaskButton}
            onPress={addSubtask}
          >
            <Text style={styles.addSubtaskText}>+ Add Sub Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaving ? styles.saveButtonDisabled : undefined,
          ]}
          onPress={handleSaveTask}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : "Save Task"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
