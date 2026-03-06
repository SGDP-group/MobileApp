import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { googleTasksService } from "@services/googleTasksService";
import { useNavigation } from "@react-navigation/native";
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

type RepeatFrequency = "daily" | "weekly" | "monthly";

const REPEAT_FREQUENCIES: RepeatFrequency[] = ["daily", "weekly", "monthly"];

const getDefaultDeadlineTime = (): Date => {
  const now = new Date();
  now.setHours(9, 0, 0, 0);
  return now;
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

const formatRepeatLabel = (frequency: RepeatFrequency): string =>
  frequency.charAt(0).toUpperCase() + frequency.slice(1);

export default function AddTaskDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [setTime, setSetTime] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(getDefaultDeadlineTime);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] =
    useState<RepeatFrequency>("weekly");
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const todayMinDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const validSubtasks = useMemo(
    () => subtasks.map((item) => item.trim()).filter(Boolean),
    [subtasks],
  );

  const updateSubtask = (index: number, value: string) => {
    setSubtasks((prev) =>
      prev.map((item, idx) => (idx === index ? value : item)),
    );
  };

  const addSubtask = () => {
    setSubtasks((prev) => [...prev, ""]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [""];
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
      dueDate.setHours(23, 59, 59, 0);
    }
    return dueDate.toISOString();
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

  const handleSaveTask = async () => {
    const title = subject.trim();
    if (!title) {
      Alert.alert("Missing Subject", "Please enter Task Subject.");
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

    try {
      setIsSaving(true);

      const notesParts = [details.trim()];
      if (repeatEnabled) {
        notesParts.push(`Repeat: ${repeatFrequency}`);
      }
      const notes = notesParts.filter(Boolean).join("\n\n");

      const createdTask = await googleTasksService.createTask(
        title,
        notes || undefined,
        dueDateIso,
      );

      for (const subtaskTitle of validSubtasks) {
        await googleTasksService.createSubtask(
          createdTask.id,
          subtaskTitle,
          undefined,
          dueDateIso,
        );
      }

      Alert.alert(
        "Task Created",
        validSubtasks.length > 0
          ? "Task and subtasks were added successfully."
          : "Task was added successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
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
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Subject *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter task subject"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={details}
            onChangeText={setDetails}
            placeholder="Enter task details"
            placeholderTextColor={colors.secondaryText}
            multiline
          />
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
          <Text style={styles.label}>Set Time</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                setTime ? styles.toggleButtonActive : undefined,
              ]}
              onPress={() => setSetTime((prev) => !prev)}
            >
              <Text style={styles.toggleText}>{setTime ? "Yes" : "No"}</Text>
            </TouchableOpacity>

            {setTime ? (
              <TouchableOpacity
                style={[styles.input, styles.pickerInput, styles.timeInput]}
                onPress={() => setShowTimePicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Select deadline time"
              >
                <Text style={styles.pickerInputText}>
                  {formatTime(deadlineTime)}
                </Text>
                <Ionicons name="time-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            ) : null}
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
            If time is off, task is created for the selected day.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Repeat</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              repeatEnabled ? styles.toggleButtonActive : undefined,
            ]}
            onPress={() => setRepeatEnabled((prev) => !prev)}
          >
            <Text style={styles.toggleText}>
              {repeatEnabled ? "Yes" : "No"}
            </Text>
          </TouchableOpacity>

          {repeatEnabled ? (
            <View style={styles.repeatOptionsRow}>
              {REPEAT_FREQUENCIES.map((frequency) => (
                <TouchableOpacity
                  key={frequency}
                  style={[
                    styles.segmentButton,
                    repeatFrequency === frequency
                      ? styles.segmentButtonActive
                      : undefined,
                  ]}
                  onPress={() => setRepeatFrequency(frequency)}
                >
                  <Text style={styles.segmentText}>
                    {formatRepeatLabel(frequency)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.helperText}>
            Repeat frequency is saved in task notes for now.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sub Tasks</Text>
          {subtasks.map((subtask, index) => (
            <View key={`subtask-${index}`} style={styles.subtaskRow}>
              <TextInput
                style={[styles.input, styles.subtaskInput]}
                value={subtask}
                onChangeText={(value) => updateSubtask(index, value)}
                placeholder={`Sub task ${index + 1}`}
                placeholderTextColor={colors.secondaryText}
              />
              <TouchableOpacity
                style={styles.removeSubtaskButton}
                onPress={() => removeSubtask(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove sub task ${index + 1}`}
              >
                <Text style={styles.removeSubtaskText}>−</Text>
              </TouchableOpacity>
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
