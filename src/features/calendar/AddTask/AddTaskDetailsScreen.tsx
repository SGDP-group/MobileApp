import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { googleTasksService } from "@services/googleTasksService";
import RepeatModal, { RecurrenceData } from "@shared/components/RepeatModal";
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

const getDefaultDeadlineTime = (): Date => new Date();

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

export default function AddTaskDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [setTime, setSetTime] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(getDefaultDeadlineTime);
  const [recurrence, setRecurrence] = useState<RecurrenceData | null>(null);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
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
      const now = new Date();
      dueDate.setHours(
        now.getHours(),
        now.getMinutes(),
        0,
        0,
      );
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

  const getRecurrenceText = () => {
    if (!recurrence) {
      return "Does not repeat";
    }
    const { frequency, interval, byWeekDay, setTime } = recurrence;
    
    let text = "";
    if (frequency === "weekly" && byWeekDay && byWeekDay.length > 0) {
      const days = byWeekDay.map(d => d.slice(0, 2)).join(", ");
      text = `Every ${interval > 1 ? interval + " " : ""}week${interval > 1 ? "s" : ""} on ${days}`;
    } else {
      const freq = frequency === "daily" ? "day" : 
                   frequency === "weekly" ? "week" : 
                   frequency === "monthly" ? "month" : "year";
      text = `Every ${interval > 1 ? interval + " " : ""}${freq}${interval > 1 ? "s" : ""}`;
    }
    
    if (setTime) {
      text += ` at ${setTime}`;
    }
    
    return text;
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
      if (recurrence) {
        const { frequency, interval, byWeekDay, endType, setTime } = recurrence;
        let repeatText = `Repeat: Every ${interval > 1 ? interval + " " : ""}${frequency}${interval > 1 ? "s" : ""}`;
        
        if (frequency === "weekly" && byWeekDay && byWeekDay.length > 0) {
          const days = byWeekDay.map(d => d.slice(0, 2)).join(", ");
          repeatText += ` on ${days}`;
        }
        
        if (setTime) {
          repeatText += ` at ${setTime}`;
        }
        
        if (endType === "on" && recurrence.endDate) {
          repeatText += ` until ${recurrence.endDate}`;
        } else if (endType === "after" && recurrence.count) {
          repeatText += ` for ${recurrence.count} occurrences`;
        }
        
        notesParts.push(repeatText);
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
          <Text style={styles.label}>Set Date *</Text>
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
                accessibilityLabel="Remove time"
              >
                <Text style={styles.removeSubtaskText}>−</Text>
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
          <Text style={styles.label}>Repeat</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerInput]}
            onPress={() => setShowRepeatModal(true)}
          >
            <Text style={styles.pickerInputText}>{getRecurrenceText()}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
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

      <RepeatModal
        visible={showRepeatModal}
        recurrence={recurrence}
        onClose={() => setShowRepeatModal(false)}
        onSave={(data) => {
          setRecurrence(data);
          
          // Sync start date and time from recurrence to main task
          if (data.startDate) {
            const [year, month, day] = data.startDate.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            setDeadlineDate(newDate);
          }
          
          if (data.setTime) {
            const [hours, minutes] = data.setTime.split(':').map(Number);
            const newTime = new Date();
            newTime.setHours(hours, minutes, 0, 0);
            setDeadlineTime(newTime);
            setSetTime(true);
          }
          
          setShowRepeatModal(false);
        }}
        initialDateTime={buildDueDateIso()}
      />
    </SafeAreaView>
  );
}
