import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { aiBreakdownService } from "@services/aiBreakdownService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useState } from "react";
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
import { styles } from "../styles/addTaskDetails.styles";

const VALIDATION_ERRORS = {
  MISSING_TASK_TITLE: {
    title: "Missing Task Title",
    message: "Please enter a task title.",
  },
  MISSING_DESCRIPTION: {
    title: "Missing Description",
    message: "Please enter a task description.",
  },
  MISSING_START_TIME: {
    title: "Missing Start Date/Time",
    message: "Please select a start date and time.",
  },
  MISSING_END_TIME: {
    title: "Missing End Date/Time",
    message: "Please select an end date and time.",
  },
  INVALID_TIME_RANGE: {
    title: "Invalid Time Range",
    message: "End time must be after start time.",
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
  USER_NOT_LINKED: {
    title: "User Not Linked",
    message: "Please link your account to the focus frame service.",
  },
};

export default function AIBreakdownScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePickerField, setActivePickerField] = useState<
    "start" | "end" | null
  >(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [pendingDateTime, setPendingDateTime] = useState<Date | null>(null);
  const [maximumTimePerTask, setMaximumTimePerTask] = useState<number>(5);

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

    if (!startTime) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_START_TIME.title,
        VALIDATION_ERRORS.MISSING_START_TIME.message,
      );
      return false;
    }

    if (!endTime) {
      Alert.alert(
        VALIDATION_ERRORS.MISSING_END_TIME.title,
        VALIDATION_ERRORS.MISSING_END_TIME.message,
      );
      return false;
    }

    if (startTime >= endTime) {
      Alert.alert(
        VALIDATION_ERRORS.INVALID_TIME_RANGE.title,
        VALIDATION_ERRORS.INVALID_TIME_RANGE.message,
      );
      return false;
    }

    return true;
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

  const handleDateTimeChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date,
  ) => {
    if (event.type !== "set" || !selectedValue || !activePickerField) {
      setActivePickerField(null);
      setPickerMode("date");
      setPendingDateTime(null);
      return;
    }

    if (pickerMode === "date") {
      const todayStart = getTodayMinDate();
      const selectedDateStart = new Date(selectedValue);
      selectedDateStart.setHours(0, 0, 0, 0);

      if (selectedDateStart < todayStart) {
        Alert.alert("Invalid Date", "Please select today or a future date.");
        return;
      }

      setPendingDateTime(selectedValue);
      setPickerMode("time");
      return;
    }

    const dateValue =
      pendingDateTime ||
      (activePickerField === "start" ? startTime : endTime) ||
      new Date();

    const finalDateTime = new Date(dateValue);
    finalDateTime.setHours(
      selectedValue.getHours(),
      selectedValue.getMinutes(),
      0,
      0,
    );

    if (activePickerField === "start") {
      setStartTime(finalDateTime);
    } else {
      setEndTime(finalDateTime);
    }

    setActivePickerField(null);
    setPickerMode("date");
    setPendingDateTime(null);
  };

  const handleGenerateSubtasks = async () => {
    if (!validateInputs()) return;

    try {
      setIsGenerating(true);

      const durationMs = endTime!.getTime() - startTime!.getTime();
      const duration = Math.round(durationMs / (1000 * 60));

      const userId = await getStoredUserId();
      if (!userId) {
        Alert.alert(
          VALIDATION_ERRORS.USER_NOT_LINKED.title,
          VALIDATION_ERRORS.USER_NOT_LINKED.message,
        );
        return;
      }

      const request = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        duration,
        maximum_time_per_task: maximumTimePerTask,
        user_id: userId?.toString(),
        session_id: `session_${Date.now()}`,
      };

      const validation = aiBreakdownService.validateRequest(request);
      if (!validation.valid) {
        Alert.alert("Invalid Input", validation.errors.join("\n"));
        return;
      }

      const response = await aiBreakdownService.breakdownTask(request);

      if (!response.success || !response.tasks || response.tasks.length === 0) {
        Alert.alert(
          VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.title,
          response.error || VALIDATION_ERRORS.AI_BREAKDOWN_FAILED.message,
        );
        return;
      }

      (navigation as any).navigate("AIBreakdownResult", {
        result: response,
        startTime: startTime,
      });
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

  return (
    <SafeAreaView style={styles.container}>
      {isGenerating && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 15, fontWeight: '600', fontSize: 16 }}>
            Generating subtasks...
          </Text>
        </View>
      )}

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
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max Time per Subtask (min) *</Text>
              <TextInput
                style={styles.input}
                value={maximumTimePerTask.toString()}
                onChangeText={(value) => {
                  const num = parseInt(value, 10);
                  if (!isNaN(num) && num > 0) {
                    setMaximumTimePerTask(num);
                  } else if (value === "") {
                    setMaximumTimePerTask(0);
                  }
                }}
                onBlur={() => {
                  if (maximumTimePerTask === 0) {
                    setMaximumTimePerTask(5);
                  }
                }}
                placeholder="Max time per subtask"
                placeholderTextColor={colors.secondaryText}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput, styles.timeInput]}
              onPress={() => {
                setPendingDateTime(startTime ?? new Date());
                setActivePickerField("start");
                setPickerMode("date");
              }}
              accessibilityRole="button"
              accessibilityLabel="Set start date and time"
            >
              <Text style={styles.pickerInputText}>
                {startTime ? formatDateTime(startTime) : "Start Date & Time"}
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.pickerInput, styles.timeInput]}
              onPress={() => {
                setPendingDateTime(endTime ?? new Date());
                setActivePickerField("end");
                setPickerMode("date");
              }}
              accessibilityRole="button"
              accessibilityLabel="Set end date and time"
            >
              <Text style={styles.pickerInputText}>
                {endTime ? formatDateTime(endTime) : "End Date & Time"}
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {activePickerField && (
          <DateTimePicker
            value={
              pendingDateTime ||
              (activePickerField === "start" ? startTime : endTime) ||
              new Date()
            }
            mode={pickerMode}
            is24Hour
            display="default"
            minimumDate={getTodayMinDate()}
            onChange={handleDateTimeChange}
          />
        )}

        {startTime && endTime && (
          <View style={styles.formGroup}>
            <View style={styles.durationContainer}>
              <Text style={styles.label}>Calculated Duration</Text>
              <Text style={styles.durationText}>
                {Math.round(
                  (endTime.getTime() - startTime.getTime()) / (1000 * 60),
                )}{" "}
                minutes
              </Text>
              <Text style={styles.durationSubtaskLabel}>
                Max per subtask: {maximumTimePerTask} minutes
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
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
      </View>
    </SafeAreaView>
  );
}