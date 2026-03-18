import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { createTask as createFocusFrameTask } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
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
  estimatedTime: string;
};

const getDefaultDeadlineTime = (): Date => new Date();

const getEmptySubtask = (): SubtaskDraft => ({
  name: "",
  description: "",
  estimatedTime: "",
});

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

const sanitizeNumberInput = (value: string): string =>
  value.replace(/[^0-9]/g, "");

export default function AddTaskDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [setStartTime, setSetStartTime] = useState(false);
  const [startTime, setStartTime_state] = useState(getDefaultDeadlineTime);
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [setTime, setSetTime] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(getDefaultDeadlineTime);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([getEmptySubtask()]);
  const [isSaving, setIsSaving] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const todayMinDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const validSubtasks = useMemo(
    () =>
      subtasks
        .map((subtask) => ({
          name: subtask.name.trim(),
          description: subtask.description.trim(),
          estimatedTime: subtask.estimatedTime.trim(),
        }))
        .filter((subtask) => subtask.name.length > 0),
    [subtasks],
  );

  const updateSubtaskField = (
    index: number,
    field: keyof SubtaskDraft,
    value: string,
  ) => {
    const normalizedValue =
      field === "estimatedTime" ? sanitizeNumberInput(value) : value;

    setSubtasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: normalizedValue } : item,
      ),
    );
  };

  const addSubtask = () => {
    setSubtasks((prev) => [...prev, getEmptySubtask()]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [getEmptySubtask()];
    });
  };

  const buildDueDateIso = (): string => {
    const dueDate = new Date(deadlineDate);
    if (setTime) {
      dueDate.setHours(
        deadlineTime.getHours(),
        deadlineTime.getMinutes(),
        0,
        0,
      );
    } else {
      const now = new Date();
      dueDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    return dueDate.toISOString();
  };

  const buildStartDateTime = (): Date => {
    const start = new Date(startDate);
    if (setStartTime) {
      start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }
    return start;
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setDeadlineDate(selectedDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedTime) {
      setDeadlineTime(selectedTime);
    }
  };

  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowStartDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    setShowStartTimePicker(false);
    if (event.type === "set" && selectedTime) {
      setStartTime_state(selectedTime);
    }
  };

  const handleSaveTask = async () => {
    const title = taskName.trim();
    if (!title) {
      Alert.alert("Missing Task Name", "Please enter a task name.");
      return;
    }

    const dueDateIso = buildDueDateIso();
    const dueDate = new Date(dueDateIso);
    if (dueDate < new Date()) {
      Alert.alert(
        "Invalid Deadline",
        "You cannot create a task before now. Please select a future date/time.",
      );
      return;
    }

    const startDateTime = buildStartDateTime();
    if (startDateTime >= dueDate) {
      Alert.alert(
        "Invalid Start Date",
        "Start date/time must be before deadline date/time.",
      );
      return;
    }

    const durationInMinutes = Math.max(
      0,
      Math.round((dueDate.getTime() - startDateTime.getTime()) / 60000),
    );

    try {
      setIsSaving(true);

      const userId = await getStoredUserId();
      if (!userId) {
        Alert.alert(
          "User Not Linked",
          "Please sign in again before creating a task.",
        );
        return;
      }

      const notesParts: string[] = [];
      const trimmedDescription = taskDescription.trim();
      if (trimmedDescription) {
        notesParts.push(trimmedDescription);
      }

      const description = notesParts.join("\n\n");
      const signedInUser = await GoogleSignin.getCurrentUser();
      const userEmail = signedInUser?.user?.email || "";

      await createFocusFrameTask({
        name: title,
        description: description || "",
        deadline: dueDateIso,
        duration: durationInMinutes,
        user: {
          id: userId,
          email: userEmail,
        },
      });

      Alert.alert("Task Created", "Task was added successfully.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerInput]}
            onPress={() => setShowStartDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select start date"
          >
            <Text style={styles.pickerInputText}>{formatDate(startDate)}</Text>
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          {showStartDatePicker ? (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={todayMinDate}
              onChange={handleStartDateChange}
            />
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Start Time</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput, styles.timeInput]}
              onPress={() => {
                setSetStartTime(true);
                setShowStartTimePicker(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Set start time"
            >
              <Text style={styles.pickerInputText}>
                {setStartTime ? formatTime(startTime) : "Set Time"}
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            {setStartTime && (
              <TouchableOpacity
                style={styles.removeSubtaskButton}
                onPress={() => setSetStartTime(false)}
                accessibilityRole="button"
                accessibilityLabel="Remove start time"
              >
                <Text style={styles.removeSubtaskText}>-</Text>
              </TouchableOpacity>
            )}
          </View>

          {setStartTime && showStartTimePicker ? (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour
              display="default"
              onChange={handleStartTimeChange}
            />
          ) : null}

          <Text style={styles.helperText}>
            If time is not set, duration is calculated from 00:00 on the
            selected start date.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Deadline Date *</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerInput]}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select deadline date"
          >
            <Text style={styles.pickerInputText}>
              {formatDate(deadlineDate)}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          {showDatePicker ? (
            <DateTimePicker
              value={deadlineDate}
              mode="date"
              display="default"
              minimumDate={todayMinDate}
              onChange={handleDateChange}
            />
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Deadline Time</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput, styles.timeInput]}
              onPress={() => {
                setSetTime(true);
                setShowTimePicker(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Set deadline time"
            >
              <Text style={styles.pickerInputText}>
                {setTime ? formatTime(deadlineTime) : "Set Time"}
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            {setTime && (
              <TouchableOpacity
                style={styles.removeSubtaskButton}
                onPress={() => setSetTime(false)}
                accessibilityRole="button"
                accessibilityLabel="Remove deadline time"
              >
                <Text style={styles.removeSubtaskText}>-</Text>
              </TouchableOpacity>
            )}
          </View>

          {setTime && showTimePicker ? (
            <DateTimePicker
              value={deadlineTime}
              mode="time"
              is24Hour
              display="default"
              onChange={handleTimeChange}
            />
          ) : null}

          <Text style={styles.helperText}>
            If time is not set, task is created for the selected day.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sub Tasks</Text>
          {subtasks.map((subtask, index) => (
            <View key={`subtask-${index}`} style={styles.subtaskCard}>
              <View style={styles.subtaskHeader}>
                <Text style={styles.subtaskTitle}>Sub Task {index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeSubtaskButton}
                  onPress={() => removeSubtask(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove sub task ${index + 1}`}
                >
                  <Text style={styles.removeSubtaskText}>-</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                value={subtask.name}
                onChangeText={(value) =>
                  updateSubtaskField(index, "name", value)
                }
                placeholder="Sub task name"
                placeholderTextColor={colors.secondaryText}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  styles.subtaskDescriptionInput,
                ]}
                value={subtask.description}
                onChangeText={(value) =>
                  updateSubtaskField(index, "description", value)
                }
                placeholder="Sub task description (optional)"
                placeholderTextColor={colors.secondaryText}
                multiline
              />

              <TextInput
                style={[styles.input, styles.subtaskEstimatedTimeInput]}
                value={subtask.estimatedTime}
                onChangeText={(value) =>
                  updateSubtaskField(index, "estimatedTime", value)
                }
                placeholder="Estimated time (min)"
                placeholderTextColor={colors.secondaryText}
                keyboardType="number-pad"
                inputMode="numeric"
              />
            </View>
          ))}

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
