import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { aiBreakdownService } from "@services/aiBreakdownService";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles/addTaskDetails.styles";

type AISubtask = {
  name: string;
  description: string;
  estimatedMinutes: number;
  startTime: Date | null;
  endTime: Date | null;
};

type SubtaskPickerState = {
  index: number;
  field: "startTime" | "endTime";
  mode: "date" | "time";
};

const TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo";

const VALIDATION_ERRORS = {
  MISSING_TASK_TITLE: {
    title: "Missing Task Title",
    message: "Please enter a task title.",
  },
  MISSING_DESCRIPTION: {
    title: "Missing Description",
    message: "Please enter a task description.",
  },
  MISSING_DURATION: {
    title: "Invalid Duration",
    message: "Please enter a valid total duration in minutes.",
  },
  MISSING_MAX_TIME: {
    title: "Invalid Max Time",
    message: "Please enter a valid maximum time per subtask.",
  },
  AI_BREAKDOWN_FAILED: {
    title: "AI Breakdown Failed",
    message: "Failed to break down the task. Please try again.",
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

const getTodayMinDate = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function AIBreakdownScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [maxTimePerTask, setMaxTimePerTask] = useState("");
  const [aiSubtasks, setAiSubtasks] = useState<AISubtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<
    Record<number, boolean>
  >({});
  const [activeSubtaskDateTimePicker, setActiveSubtaskDateTimePicker] =
    useState<SubtaskPickerState | null>(null);
  const [pendingSubtaskDateTime, setPendingSubtaskDateTime] =
    useState<Date | null>(null);

  const todayMinDate = useMemo(() => getTodayMinDate(), []);

  const validateInputs = (): boolean => {
    if (!taskTitle.trim()) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_TASK_TITLE.title,
        VALIDATION_ERRORS.MISSING_TASK_TITLE.message,
      );
      return false;
    }

    if (!taskDescription.trim()) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_DESCRIPTION.title,
        VALIDATION_ERRORS.MISSING_DESCRIPTION.message,
      );
      return false;
    }

    const duration = parseInt(totalDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_DURATION.title,
        VALIDATION_ERRORS.MISSING_DURATION.message,
      );
      return false;
    }

    const maxTime = parseInt(maxTimePerTask, 10);
    if (isNaN(maxTime) || maxTime <= 0 || maxTime > duration) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_MAX_TIME.title,
        VALIDATION_ERRORS.MISSING_MAX_TIME.message,
      );
      return false;
    }

    return true;
  };

  const validateSubtaskTimes = (): boolean => {
    for (let i = 0; i < aiSubtasks.length; i++) {
      const subtask = aiSubtasks[i];
      const subtaskNumber = i + 1;

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

  const handleGenerateSubtasks = async () => {
    if (!validateInputs()) return;

    try {
      setIsGenerating(true);

      const request = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        duration: parseInt(totalDuration, 10),
        maximum_time_per_task: parseInt(maxTimePerTask, 10),
        user_id: "0",
        session_id: `session_${Date.now()}`,
      };

      const validation = aiBreakdownService.validateRequest(request);
      if (!validation.valid) {
        Alert.alert("Invalid Input", validation.errors.join("\n"));
        return;
      }

      const response = await aiBreakdownService.breakdownTask(request);

      if (!response.success || response.subtasks.length === 0) {
        Alert.alert(
          VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.title,
          response.error || VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.message,
        );
        return;
      }

      const formattedSubtasks: AISubtask[] = response.subtasks
        .sort((a, b) => a.order - b.order)
        .map((subtask) => ({
          name: subtask.name,
          description: subtask.description,
          estimatedMinutes: subtask.estimated_minutes,
          startTime: null,
          endTime: null,
        }));

      setAiSubtasks(formattedSubtasks);
      Alert.alert(
        "AI Breakdown Complete",
        `Generated ${formattedSubtasks.length} subtasks. Please set the start and end times.`,
      );
    } catch (error) {
      console.error("Error generating subtasks:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert(
        VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.title,
        `${VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.message}\n\nError: ${errorMessage}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSubtaskTime = (
    index: number,
    field: "startTime" | "endTime",
    value: Date,
  ) => {
    setAiSubtasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
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
        aiSubtasks[pickerContext.index]?.[pickerContext.field] ??
        new Date();
      const next = new Date(selectedValue);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);

      setPendingSubtaskDateTime(next);
      setActiveSubtaskDateTimePicker({ ...pickerContext, mode: "time" });
      return;
    }

    const dateValue =
      pendingSubtaskDateTime ??
      aiSubtasks[pickerContext.index]?.[pickerContext.field] ??
      new Date();
    const next = new Date(dateValue);
    next.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);

    updateSubtaskTime(pickerContext.index, pickerContext.field, next);
    setActiveSubtaskDateTimePicker(null);
    setPendingSubtaskDateTime(null);
  };

  const toggleSubtaskCollapse = (index: number) => {
    setCollapsedSubtasks((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  };

  const renderSubtaskCard = (subtask: AISubtask, index: number) => {
    const isCollapsed = collapsedSubtasks[index] ?? false;

    return (
      <View key={`subtask-${index}`} style={styles.subtaskCard}>
        <View style={styles.subtaskHeader}>
          <View style={styles.subtaskTitleWrap}>
            <Text style={styles.subtaskOrderBadge}>{index + 1}</Text>
            <View>
              <Text style={styles.subtaskTitle}>{subtask.name}</Text>
              <Text style={styles.helperText}>
                {subtask.estimatedMinutes} min (est.)
              </Text>
            </View>
          </View>
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
        </View>

        {!isCollapsed && (
          <View style={styles.subtaskContent}>
            <Text style={styles.helperText}>{subtask.description}</Text>

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
                accessibilityLabel={`Set start date and time for sub task ${
                  index + 1
                }`}
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
                accessibilityLabel={`Set end date and time for sub task ${
                  index + 1
                }`}
              >
                <Text style={styles.pickerInputText}>
                  {subtask.endTime
                    ? formatDateTime(subtask.endTime)
                    : "End Date & Time"}
                </Text>
                <Ionicons name="time-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>AI Task Breakdown</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.divider} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="e.g., How to make coffee"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={taskDescription}
            onChangeText={setTaskDescription}
            placeholder="Describe the task in detail"
            placeholderTextColor={colors.secondaryText}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Total Duration (min) *</Text>
              <TextInput
                style={styles.input}
                value={totalDuration}
                onChangeText={setTotalDuration}
                placeholder="5"
                placeholderTextColor={colors.secondaryText}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max per Subtask (min) *</Text>
              <TextInput
                style={styles.input}
                value={maxTimePerTask}
                onChangeText={setMaxTimePerTask}
                placeholder="2"
                placeholderTextColor={colors.secondaryText}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isGenerating ? styles.saveButtonDisabled : undefined,
          ]}
          onPress={handleGenerateSubtasks}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Generate Subtasks with AI</Text>
          )}
        </TouchableOpacity>

        {aiSubtasks.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Generated Subtasks</Text>
            {aiSubtasks.map((subtask, index) =>
              renderSubtaskCard(subtask, index),
            )}

            {activeSubtaskDateTimePicker ? (
              <DateTimePicker
                value={
                  pendingSubtaskDateTime ??
                  aiSubtasks[activeSubtaskDateTimePicker.index]?.[
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
