import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { createSubtask as createFocusFrameSubtask } from "@services/focusFrameSubtaskService";
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
  startTime: Date | null;
  endTime: Date | null;
};

const getDefaultDeadlineTime = (): Date => new Date();

const getEmptySubtask = (): SubtaskDraft => ({
  name: "",
  description: "",
  startTime: null,
  endTime: null,
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

const formatDateTime = (value: Date): string =>
  `${formatDate(value)} ${formatTime(value)}`;

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
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<
    Record<number, boolean>
  >({});
  const [activeSubtaskDateTimePicker, setActiveSubtaskDateTimePicker] =
    useState<{
      index: number;
      field: "startTime" | "endTime";
      mode: "date" | "time";
    } | null>(null);
  const [pendingSubtaskDateTime, setPendingSubtaskDateTime] =
    useState<Date | null>(null);

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
          startTime: subtask.startTime,
          endTime: subtask.endTime,
        }))
        .filter((subtask) => subtask.name.length > 0),
    [subtasks],
  );

  const taskDurationInMinutes = useMemo(() => {
    const dueDateIso = (() => {
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
      return dueDate;
    })();

    const startDateTime = (() => {
      const start = new Date(startDate);
      if (setStartTime) {
        start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      } else {
        start.setHours(0, 0, 0, 0);
      }
      return start;
    })();

    return Math.max(
      0,
      Math.round((dueDateIso.getTime() - startDateTime.getTime()) / 60000),
    );
  }, [deadlineDate, setTime, deadlineTime, startDate, setStartTime, startTime]);

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

  const getSubtaskDurationInMinutes = (
    subtask: SubtaskDraft,
  ): number | null => {
    if (!subtask.startTime || !subtask.endTime) {
      return null;
    }

    const diff = subtask.endTime.getTime() - subtask.startTime.getTime();
    if (diff <= 0) {
      return null;
    }

    return Math.round(diff / 60000);
  };

  const addSubtask = () => {
    const newIndex = subtasks.length;
    setSubtasks((prev) => [...prev, getEmptySubtask()]);
    setCollapsedSubtasks((prev) => ({ ...prev, [newIndex]: false }));
  };

  const toggleSubtaskCollapse = (index: number) => {
    setCollapsedSubtasks((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
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
      if (!prev) {
        return null;
      }
      if (prev.index === index) {
        return null;
      }
      if (prev.index > index) {
        return { ...prev, index: prev.index - 1 };
      }
      return prev;
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

    for (let i = 0; i < validSubtasks.length; i++) {
      const subtask = validSubtasks[i];
      if (subtask.startTime && subtask.endTime) {
        if (subtask.startTime >= subtask.endTime) {
          Alert.alert(
            "Invalid Subtask Dates",
            `Sub Task ${i + 1}: Start date/time must be before end date/time.`,
          );
          return;
        }
      }
    }

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

      const createdTask = await createFocusFrameTask({
        name: title,
        description: description || "",
        deadline: dueDateIso,
        duration: taskDurationInMinutes,
        user: {
          id: userId,
          email: userEmail,
        },
      });

      if (!createdTask?.id) {
        throw new Error("Task created without task id.");
      }

      const subTasksPayload = validSubtasks.map((subtask, index) => {
        const subtaskStart = subtask.startTime ?? startDateTime;
        const subtaskEndCandidate = subtask.endTime ?? dueDate;
        const subtaskEnd =
          subtaskEndCandidate.getTime() >= subtaskStart.getTime()
            ? subtaskEndCandidate
            : subtaskStart;

        return {
          name: subtask.name,
          description: subtask.description || "",
          task: {
            id: createdTask.id,
          },
          status: {
            id: 1,
          },
          taskOrder: index + 1,
          startTime: subtaskStart.toISOString(),
          endTime: subtaskEnd.toISOString(),
          duration: Math.max(
            0,
            Math.round((subtaskEnd.getTime() - subtaskStart.getTime()) / 60000),
          ),
          completed: false,
          isTracked: false,
          isAiBreakdown: false,
        };
      });

      if (subTasksPayload.length > 0) {
        try {
          await Promise.all(
            subTasksPayload.map((subtask) =>
              createFocusFrameSubtask(subtask as any),
            ),
          );
        } catch (subtaskError) {
          console.error("Error creating subtasks:", subtaskError);
          Alert.alert(
            "Task Created with Warnings",
            "Main task was created, but one or more subtasks failed to save.",
            [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ],
          );
          return;
        }
      }

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
          <Text style={styles.label}>Task Duration</Text>
          <Text style={styles.pickerInputText}>
            {taskDurationInMinutes > 0
              ? `${taskDurationInMinutes} minutes`
              : "--"}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sub Tasks</Text>
          {subtasks.map((subtask, index) => (
            <View key={`subtask-${index}`} style={styles.subtaskCard}>
              {(() => {
                const isCollapsed = collapsedSubtasks[index] ?? false;
                return (
                  <>
                    <View style={styles.subtaskHeader}>
                      <Text style={styles.subtaskTitle}>
                        Sub Task {index + 1}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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

                    {!isCollapsed ? (
                      <>
                        <TextInput
                          style={styles.input}
                          value={subtask.name}
                          onChangeText={(value) =>
                            updateSubtaskTextField(index, "name", value)
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
                            updateSubtaskTextField(index, "description", value)
                          }
                          placeholder="Sub task description (optional)"
                          placeholderTextColor={colors.secondaryText}
                          multiline
                        />

                        <View style={styles.row}>
                          <TouchableOpacity
                            style={[
                              styles.input,
                              styles.pickerInput,
                              styles.timeInput,
                            ]}
                            onPress={() => {
                              setPendingSubtaskDateTime(
                                subtask.startTime ?? new Date(),
                              );
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
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={colors.text}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.input,
                              styles.pickerInput,
                              styles.timeInput,
                            ]}
                            onPress={() => {
                              setPendingSubtaskDateTime(
                                subtask.endTime ?? new Date(),
                              );
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
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={colors.text}
                            />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.helperText}>
                          Duration:{" "}
                          {getSubtaskDurationInMinutes(subtask) ?? "--"} min
                        </Text>
                      </>
                    ) : null}
                  </>
                );
              })()}
            </View>
          ))}

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
