import { useLoading } from "@/src/shared/contexts/LoadingContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { createSubtask as createFocusFrameSubtask } from "@services/focusFrameSubtaskService";
import { createTask as createFocusFrameTask } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { googleCalendarService } from "@services/googleCalendarService";
import {
  calculateEndTime,
  formatDateFromDate,
  formatTimeFromDate,
  scheduleSubtasksWithConflictDetection,
} from "@services/subtaskSchedulingService";
import StyledAlert from "@shared/components/StyledAlert";
import {
  RootNavigationProp,
  RootStackParamList,
} from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles as detailsStyles } from "../styles/addTaskDetails.styles";
import { styles } from "../styles/aiBreakdownResult.styles";
import { Subtask } from "../types/types";
import { SUCCESS_MESSAGES, VALIDATION_ERRORS } from "../utils/validationMessages";
import { getDeviceTimeZone, toOffsetDateTime } from "./../utils/timezone";



const getDurationDisplay = (time: number | string): string => {
  const parsedTime = typeof time === "string" ? parseInt(time, 10) : time;
  return isNaN(parsedTime) || parsedTime <= 0 ? "--" : parsedTime.toString();
};

const validateSubtaskTime = (time: string): boolean => {
  if (time.trim() === "") {
    return false;
  }
  const parsedTime = parseInt(time, 10);
  if (isNaN(parsedTime)) {
    return false;
  }
  if (parsedTime <= 0) {
    return false;
  }
  return true;
};

const validateSubtaskDescription = (description: string): boolean => {
  if (!description.trim()) {
    return false;
  }
  return true;
};


const TIMEZONE = getDeviceTimeZone();

const toTwoDigits = (num: number): string => String(num).padStart(2, "0");

// const toLocalApiDateTime = (value: Date): string => {
//   const year = value.getFullYear();
//   const month = toTwoDigits(value.getMonth() + 1);
//   const day = toTwoDigits(value.getDate());
//   const hours = toTwoDigits(value.getHours());
//   const minutes = toTwoDigits(value.getMinutes());
//   const seconds = toTwoDigits(value.getSeconds());

//   return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
// };

// const toOffsetDateTime = (value: Date): string => {
//   const localDateTime = toLocalApiDateTime(value);
//   const offsetMinutes = -value.getTimezoneOffset();
//   const sign = offsetMinutes >= 0 ? "+" : "-";
//   const absOffsetMinutes = Math.abs(offsetMinutes);
//   const hours = toTwoDigits(Math.floor(absOffsetMinutes / 60));
//   const minutes = toTwoDigits(absOffsetMinutes % 60);

//   return `${localDateTime}${sign}${hours}:${minutes}`;
// };

const SubtaskItem: React.FC<{
  subtask: Subtask;
  depth: number;
  isEditing: boolean;
  isScheduling: boolean;
  onUpdate: (newDescription: string, newTime: number) => void;
  onUpdateDateTime: (startTime: string, endTime: string, date: string) => void;
  onRemove: () => void;
  index: number;
  parentIndices?: number[];
}> = ({
  subtask,
  depth,
  isEditing,
  isScheduling,
  onUpdate,
  onUpdateDateTime,
  onRemove,
  index,
  parentIndices = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(subtask.description);
  const [estimatedTime, setEstimatedTime] = useState(
    subtask.estimated_time.toString(),
  );
  const [startDateTime, setStartDateTime] = useState(
    subtask.date && subtask.startTime
      ? `${subtask.date} ${subtask.startTime}`
      : `${formatDateFromDate(new Date())} 09:00`,
  );

  const calculatedEndTime = calculateEndTime(
    subtask.startTime || "09:00",
    subtask.estimated_time,
  );
  const [endDateTime, setEndDateTime] = useState(
    subtask.date && subtask.endTime
      ? `${subtask.date} ${subtask.endTime}`
      : `${subtask.date || formatDateFromDate(new Date())} ${calculatedEndTime}`,
  );

  const [showStartDateTimePicker, setShowStartDateTimePicker] = useState(false);
  const [showEndDateTimePicker, setShowEndDateTimePicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<"date" | "time">(
    "date",
  );
  const [endPickerMode, setEndPickerMode] = useState<"date" | "time">("date");
  const [pendingStartDateTime, setPendingStartDateTime] = useState<Date | null>(
    null,
  );
  const [pendingEndDateTime, setPendingEndDateTime] = useState<Date | null>(
    null,
  );

  React.useEffect(() => {
    if (subtask.date && subtask.startTime && subtask.endTime) {
      setStartDateTime(`${subtask.date} ${subtask.startTime}`);
      setEndDateTime(`${subtask.date} ${subtask.endTime}`);
    }
  }, [subtask.date, subtask.startTime, subtask.endTime]);

  const parseSubtaskDateTime = (
    dateTimeStr: string,
  ): { date: string; time: string } => {
    const [date, time] = dateTimeStr.split(" ");
    return {
      date: date || formatDateFromDate(new Date()),
      time: time || "09:00",
    };
  };

  const hasNestedSubtasks = subtask.subtasks && subtask.subtasks.length > 0;
  const paddingLeft = depth * 16;

  const handleTimeChange = (newTime: string) => {
    setEstimatedTime(newTime);

    if (
      !validateSubtaskTime(newTime) ||
      !validateSubtaskDescription(description)
    ) {
      return;
    }

    const parsedTime = parseInt(newTime, 10);
    onUpdate(description, parsedTime);
  };

  const handleDescriptionChange = (newDesc: string) => {
    setDescription(newDesc);

    const parsedTime = parseInt(estimatedTime, 10);
    if (
      !validateSubtaskDescription(newDesc) ||
      isNaN(parsedTime) ||
      parsedTime <= 0
    ) {
      return;
    }

    onUpdate(newDesc, parsedTime);
  };

  const handleStartDateTimeChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate || event.type !== "set") {
      setShowStartDateTimePicker(false);
      setStartPickerMode("date");
      setPendingStartDateTime(null);
      return;
    }

    if (startPickerMode === "date") {
      const currentValue = pendingStartDateTime || new Date();
      const next = new Date(selectedDate);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);
      setPendingStartDateTime(next);
      setStartPickerMode("time");
      return;
    }

    const dateValue = pendingStartDateTime || new Date();
    const finalDateTime = new Date(dateValue);
    finalDateTime.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0,
    );

    const dateStr = formatDateFromDate(finalDateTime);
    const timeStr = formatTimeFromDate(finalDateTime);
    const newStartDateTime = `${dateStr} ${timeStr}`;
    setStartDateTime(newStartDateTime);

    const newEndDateTime = `${dateStr} ${calculateEndTime(
      timeStr,
      parseInt(estimatedTime, 10),
    )}`;

    setEndDateTime(newEndDateTime);

    setShowStartDateTimePicker(false);
    setStartPickerMode("date");
    setPendingStartDateTime(null);
  };

  const handleEndDateTimeChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate || event.type !== "set") {
      setShowEndDateTimePicker(false);
      setEndPickerMode("date");
      setPendingEndDateTime(null);
      return;
    }

    if (endPickerMode === "date") {
      const currentValue = pendingEndDateTime || new Date();
      const next = new Date(selectedDate);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);
      setPendingEndDateTime(next);
      setEndPickerMode("time");
      return;
    }

    const dateValue = pendingEndDateTime || new Date();
    const finalDateTime = new Date(dateValue);
    finalDateTime.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0,
    );

    const dateStr = formatDateFromDate(finalDateTime);
    const timeStr = formatTimeFromDate(finalDateTime);
    setEndDateTime(`${dateStr} ${timeStr}`);

    setShowEndDateTimePicker(false);
    setEndPickerMode("date");
    setPendingEndDateTime(null);
  };

  const formatDisplayDateTime = (): string => {
    if (!subtask.date || !subtask.startTime) {
      return "Not scheduled";
    }
    return `${subtask.date} ${subtask.startTime} - ${subtask.endTime}`;
  };

  const parseDateTime = (
    dateTimeStr: string,
  ): { date: string; time: string } => {
    const [date, time] = dateTimeStr.split(" ");
    return {
      date: date || formatDateFromDate(new Date()),
      time: time || "09:00",
    };
  };

  const renderViewMode = () => (
    <View>
      {/* Subtask Summary */}
      <TouchableOpacity
        style={[styles.subtaskItem, { paddingLeft }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.subtaskLeft}>
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color={"#8AE8FF"}
            style={styles.expandIcon}
          />
          <View style={styles.subtaskContent}>
            <Text
              style={[
                styles.subtaskDescription,
                subtask.status === "completed" && styles.completedText,
              ]}
              numberOfLines={1}
            >
              {subtask.description}
            </Text>
            {isScheduling && (
              <View style={{ marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#8AE8FF",
                    fontStyle: "italic",
                  }}
                >
                  {formatDisplayDateTime()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.subtaskRight}>
          <Text style={styles.estimatedTime}>{subtask.estimated_time}m</Text>
          {isScheduling && subtask.conflictDetected && (
            <View
              style={{
                marginLeft: 8,
                paddingHorizontal: 6,
                paddingVertical: 4,
                backgroundColor: "rgba(255, 152, 0, 0.2)",
                borderRadius: 4,
                borderLeftWidth: 2,
                borderLeftColor: "#FF9800",
              }}
            >
              <Ionicons name="alert-circle" size={14} color="#FF9800" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Conflict Badge */}
      {isScheduling && subtask.conflictDetected && subtask.conflictWith && (
        <View
          style={{
            marginLeft: paddingLeft + 16,
            marginRight: 16,
            marginBottom: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            borderRadius: 6,
            borderLeftWidth: 3,
            borderLeftColor: "#FF9800",
          }}
        >
          <Text style={{ fontSize: 12, color: "#FF9800", fontWeight: "500" }}>
            ⚠️ Conflict detected with "{subtask.conflictWith.taskName}"
          </Text>
          <Text style={{ fontSize: 11, color: "#FFA726", marginTop: 2 }}>
            Rescheduled to {subtask.startTime} on {subtask.date}
          </Text>
        </View>
      )}

      {/* Inline Edit Mode */}
      {expanded && (
        <View style={[detailsStyles.subtaskCard, { marginLeft: paddingLeft }]}>
          <View style={detailsStyles.formGroup}>
            <Text style={detailsStyles.subtaskTitle}>Description</Text>
            <TextInput
              style={[
                detailsStyles.input,
                detailsStyles.textArea,
                detailsStyles.subtaskDescriptionInput,
              ]}
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="Describe this subtask"
              placeholderTextColor={colors.secondaryText}
              multiline
              editable={!isScheduling}
            />
          </View>

          <View style={detailsStyles.formGroup}>
            <Text style={detailsStyles.subtaskTitle}>
              Estimated Time (minutes)
            </Text>
            <TextInput
              style={detailsStyles.input}
              value={estimatedTime}
              onChangeText={handleTimeChange}
              placeholder="Minutes"
              placeholderTextColor={colors.secondaryText}
              keyboardType="number-pad"
              editable={!isScheduling}
            />
          </View>

          <>
            {/* Start DateTime Picker */}
            <View style={detailsStyles.formGroup}>
              <Text style={detailsStyles.subtaskTitle}>Start Date & Time</Text>
              <TouchableOpacity
                style={[detailsStyles.input, { justifyContent: "center" }]}
                onPress={() => {
                  setShowStartDateTimePicker(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color="#8AE8FF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {startDateTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* End DateTime Picker */}
            <View style={detailsStyles.formGroup}>
              <Text style={detailsStyles.subtaskTitle}>End Date & Time</Text>
              <TouchableOpacity
                style={[detailsStyles.input, { justifyContent: "center" }]}
                onPress={() => {
                  setShowEndDateTimePicker(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color="#8AE8FF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {endDateTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* DateTimePicker Components */}
            {showStartDateTimePicker && (
              <DateTimePicker
                value={
                  pendingStartDateTime ||
                  new Date(
                    `${parseSubtaskDateTime(startDateTime).date}T${parseSubtaskDateTime(startDateTime).time}:00`,
                  ) ||
                  new Date()
                }
                mode={startPickerMode}
                display="default"
                onChange={handleStartDateTimeChange}
                is24Hour
              />
            )}

            {showEndDateTimePicker && (
              <DateTimePicker
                value={
                  pendingEndDateTime ||
                  new Date(
                    `${parseSubtaskDateTime(endDateTime).date}T${parseSubtaskDateTime(endDateTime).time}:00`,
                  ) ||
                  new Date()
                }
                mode={endPickerMode}
                display="default"
                onChange={handleEndDateTimeChange}
                is24Hour
              />
            )}
          </>

          <Text style={detailsStyles.helperText}>
            Duration: {getDurationDisplay(estimatedTime)} min
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 3 }]}
              onPress={() => {
                if (!isScheduling) {
                  if (
                    !validateSubtaskDescription(description) ||
                    !validateSubtaskTime(estimatedTime)
                  ) {
                    return;
                  }
                }
                if (isScheduling) {
                  const { date, time: startTime } =
                    parseSubtaskDateTime(startDateTime);
                  const { time: endTime } = parseSubtaskDateTime(endDateTime);
                  onUpdateDateTime(startTime, endTime, date);
                }
                setExpanded(false);
              }}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={onRemove}
              disabled={isScheduling}
            >
              <Text style={styles.secondaryButtonText}>
                {isScheduling ? "Remove" : "Remove"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return renderViewMode();
};

export default function AIBreakdownResultScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "AIBreakdownResult">>();
  const result = route.params?.result;
  const passedStartTime = (route.params as any)?.startTime as Date | undefined;
const { setIsLoading } = useLoading();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Alert management
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
    type?: "info" | "success" | "warning" | "error";
  }>({
    title: "",
    message: "",
    buttons: [],
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }> = [{ text: "OK", onPress: () => setAlertVisible(false) }],
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    setAlertConfig({ title, message, buttons, type });
    setAlertVisible(true);
  };
  
  // Strip time data from AI result to avoid timezone issues
  const initialSubtasks = (result?.tasks[0]?.subtasks || []).map((subtask: any) => ({
    ...subtask,
    startTime: undefined,
    endTime: undefined,
    date: undefined,
  }));
  
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    result?.tasks[0]?.subtasks || [],
  );
  const getInitialStartTime = (): string => {
    if (passedStartTime) {
      return `${formatDateFromDate(passedStartTime)} ${formatTimeFromDate(passedStartTime)}`;
    }
    return `${formatDateFromDate(new Date())} 09:00`;
  };

  const [initialStartTime, setInitialStartTime] = useState<string>(
    getInitialStartTime(),
  );
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [hasSetStartTime, setHasSetStartTime] = useState(!!passedStartTime);
  const [startTimePickerMode, setStartTimePickerMode] = useState<
    "date" | "time"
  >("date");
  const [pendingMainStartDateTime, setPendingMainStartDateTime] =
    useState<Date | null>(null);

  const mainTask = result?.tasks[0];
  const totalTime = useMemo(
    () => subtasks.reduce((sum, st) => sum + st.estimated_time, 0),
    [subtasks],
  );
  const subtaskCount = useMemo(() => subtasks.length, [subtasks]);

  React.useEffect(() => {
    if (passedStartTime && initialSubtasks.length > 0) {
      const startTimeStr = getInitialStartTime();
      const updatedSubtasks = calculateSequentialTimes(startTimeStr, initialSubtasks);
      setSubtasks(updatedSubtasks);
    }
  }, []);

  const validateSubtasksExist = (): boolean => {
    if (subtaskCount === 0) {
      showAlert(
        VALIDATION_ERRORS.NO_SUBTASKS.title,
        VALIDATION_ERRORS.NO_SUBTASKS.message,
        [{ text: "OK", onPress: () => setAlertVisible(false) }],
        "warning"
      );
      return false;
    }
    return true;
  };

  const validateAllSubtaskTimes = (): boolean => {
    const validateSubtaskArray = (
      items: Subtask[],
      prefix: string = "",
    ): boolean => {
      for (let i = 0; i < items.length; i++) {
        const time = parseInt(items[i].estimated_time.toString(), 10);
        if (isNaN(time) || time <= 0) {
          const indexDisplay = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
          showAlert(
            VALIDATION_ERRORS.INVALID_SUBTASK_TIME(i).title,
            `Subtask ${indexDisplay}: Please enter a valid time in minutes`,
            [{ text: "OK", onPress: () => setAlertVisible(false) }],
            "warning"
          );
          return false;
        }
        if (items[i].subtasks && items[i].subtasks.length > 0) {
          const nestedPrefix = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
          if (!validateSubtaskArray(items[i].subtasks, nestedPrefix)) {
            return false;
          }
        }
      }
      return true;
    };

    return validateSubtaskArray(subtasks);
  };

  const validateAllInputs = (): boolean => {
    return validateSubtasksExist() && validateAllSubtaskTimes();
  };

  const parseDateTime = (
    dateTimeStr: string,
  ): { date: string; time: string } => {
    const [date, time] = dateTimeStr.split(" ");
    return {
      date: date || formatDateFromDate(new Date()),
      time: time || "09:00",
    };
  };

  const calculateSequentialTimes = (
    startDateTime: string,
    taskList: Subtask[] = subtasks,
  ): Subtask[] => {
    const { date, time } = parseDateTime(startDateTime);
    let currentTime = time;
    let currentDate = date;

    return taskList.map((subtask) => {
      const endTime = calculateEndTime(currentTime, subtask.estimated_time);

      const updatedSubtask = {
        ...subtask,
        startTime: currentTime,
        endTime: endTime,
        date: currentDate,
      };

      currentTime = endTime;

      return updatedSubtask;
    });
  };

  const handleInitialStartTimeChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate || event.type !== "set") {
      setShowStartTimePicker(false);
      setStartTimePickerMode("date");
      setPendingMainStartDateTime(null);
      return;
    }

    if (startTimePickerMode === "date") {
      const currentValue = pendingMainStartDateTime || new Date();
      const next = new Date(selectedDate);
      next.setHours(currentValue.getHours(), currentValue.getMinutes(), 0, 0);
      setPendingMainStartDateTime(next);
      setStartTimePickerMode("time");
      return;
    }

    const dateValue = pendingMainStartDateTime || new Date();
    const finalDateTime = new Date(dateValue);
    finalDateTime.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0,
    );

    const dateStr = formatDateFromDate(finalDateTime);
    const timeStr = formatTimeFromDate(finalDateTime);
    const newStartDateTime = `${dateStr} ${timeStr}`;
    setInitialStartTime(newStartDateTime);

    const updatedSubtasks = calculateSequentialTimes(newStartDateTime);
    setSubtasks(updatedSubtasks);
    setHasSetStartTime(true);

    setShowStartTimePicker(false);
    setStartTimePickerMode("date");
    setPendingMainStartDateTime(null);
  };

  const handleUpdateSubtask = (
    index: number,
    newDescription: string,
    newTime: number,
    parentIndices: number[] = [],
  ) => {
    setSubtasks((prev) => {
      if (parentIndices.length === 0) {
        return prev.map((item, idx) =>
          idx === index
            ? { ...item, description: newDescription, estimated_time: newTime }
            : item,
        );
      }

      const updateNested = (items: Subtask[], indices: number[]): Subtask[] => {
        if (indices.length === 1) {
          return items.map((item, idx) =>
            idx === indices[0]
              ? {
                  ...item,
                  description: newDescription,
                  estimated_time: newTime,
                }
              : item,
          );
        }
        const [currentIndex, ...restIndices] = indices;
        return items.map((item, idx) =>
          idx === currentIndex
            ? { ...item, subtasks: updateNested(item.subtasks, restIndices) }
            : item,
        );
      };

      return updateNested(prev, parentIndices);
    });
  };

  const handleUpdateSubtaskDateTime = (
    index: number,
    startTime: string,
    endTime: string,
    date: string,
    parentIndices: number[] = [],
  ) => {
    setSubtasks((prev) => {
      let updated: Subtask[];

      if (parentIndices.length === 0) {
        updated = prev.map((item, idx) =>
          idx === index ? { ...item, startTime, endTime, date } : item,
        );
      } else {
        const updateNested = (
          items: Subtask[],
          indices: number[],
        ): Subtask[] => {
          if (indices.length === 1) {
            return items.map((item, idx) =>
              idx === indices[0] ? { ...item, startTime, endTime, date } : item,
            );
          }
          const [currentIndex, ...restIndices] = indices;
          return items.map((item, idx) =>
            idx === currentIndex
              ? { ...item, subtasks: updateNested(item.subtasks, restIndices) }
              : item,
          );
        };

        updated = updateNested(prev, parentIndices);
      }

      const targetIndex = parentIndices.length === 0 ? index : index;
      const updatedSubtask = updated[targetIndex];

      if (updatedSubtask) {
        let currentTime = endTime;
        let currentDate = date;

        for (let i = targetIndex + 1; i < updated.length; i++) {
          const nextEnd = calculateEndTime(
            currentTime,
            updated[i].estimated_time,
          );
          updated[i] = {
            ...updated[i],
            startTime: currentTime,
            endTime: nextEnd,
            date: currentDate,
          };
          currentTime = nextEnd;
        }
      }

      return updated;
    });
  };

  const handleRemoveSubtask = (index: number, parentIndices: number[] = []) => {
    showAlert(
      "Remove Subtask",
      "Are you sure you want to remove this subtask?",
      [
        { text: "Cancel", onPress: () => setAlertVisible(false), style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            setAlertVisible(false);
            setSubtasks((prev) => {
              if (parentIndices.length === 0) {
                return prev.filter((_, i) => i !== index);
              }

              const removeNested = (
                items: Subtask[],
                indices: number[],
              ): Subtask[] => {
                if (indices.length === 1) {
                  return items.filter((_, i) => i !== indices[0]);
                }
                const [currentIndex, ...restIndices] = indices;
                return items.map((item, idx) =>
                  idx === currentIndex
                    ? {
                        ...item,
                        subtasks: removeNested(item.subtasks, restIndices),
                      }
                    : item,
                );
              };

              return removeNested(prev, parentIndices);
            });
          },
          style: "destructive",
        },
      ],
      "warning"
    );
  };

  const getTotalSubtaskCount = (items: Subtask[]): number => {
    return items.reduce(
      (sum, item) =>
        sum + 1 + (item.subtasks ? getTotalSubtaskCount(item.subtasks) : 0),
      0,
    );
  };

  const handleScheduleSubtasks = async () => {
    if (!validateAllInputs()) {
      return;
    }

    if (!hasSetStartTime) {
      showAlert(
        "Start Time Required",
        "Please set the start time for your tasks",
        [{ text: "OK", onPress: () => setAlertVisible(false) }],
        "warning"
      );
      return;
    }

    try {
      setIsScheduling(true);

      const userId = await getStoredUserId();
      if (!userId) {
        showAlert(
          VALIDATION_ERRORS.USER_NOT_LINKED.title,
          VALIDATION_ERRORS.USER_NOT_LINKED.message,
          [{ text: "OK", onPress: () => setAlertVisible(false) }],
          "error"
        );
        setIsScheduling(false);
        return;
      }

      const subtasksWithTimes = calculateSequentialTimes(initialStartTime);

      const schedulePayload = subtasksWithTimes.map((subtask) => ({
        description: subtask.description,
        estimatedTime: subtask.estimated_time,
        preferredDate: subtask.date || formatDateFromDate(new Date()),
        preferredStartTime: subtask.startTime,
      }));

      const response = await scheduleSubtasksWithConflictDetection(
        userId,
        schedulePayload,
      );

      if (response.success) {
        const updatedSubtasks = subtasksWithTimes.map((subtask, index) => {
          const scheduled = response.scheduledSubtasks[index];
          if (scheduled) {
            return {
              ...subtask,
              startTime: scheduled.startTime.split("T")[1].substring(0, 5),
              endTime: scheduled.endTime.split("T")[1].substring(0, 5),
              date: scheduled.startTime.split("T")[0],
              conflictDetected: scheduled.conflictDetected,
              conflictWith: scheduled.conflictWith,
            };
          }
          return subtask;
        });

        setSubtasks(updatedSubtasks);

        if (response.scheduledSubtasks.length > 0) {
          const firstScheduled = response.scheduledSubtasks[0];
          const scheduledDate = firstScheduled.startTime.split("T")[0];
          const scheduledTime = firstScheduled.startTime
            .split("T")[1]
            .substring(0, 5);
          setInitialStartTime(`${scheduledDate} ${scheduledTime}`);
        }

        if (response.conflictSummary && response.conflictSummary.length > 0) {
          showAlert(
            "Conflicts Resolved",
            `${response.conflictSummary.length} subtask(s) were rescheduled due to conflicts.\n\n${response.message}`,
            [{ text: "OK", onPress: () => setAlertVisible(false) }],
            "info"
          );
        }
        setIsScheduling(false);
      } else {
        setIsScheduling(false);
        showAlert(
          VALIDATION_ERRORS.SCHEDULING_FAILED.title,
          VALIDATION_ERRORS.SCHEDULING_FAILED.message,
          [{ text: "OK", onPress: () => setAlertVisible(false) }],
          "error"
        );
      }
    } catch (error) {
      console.error("Error scheduling subtasks:", error);
      setIsScheduling(false);
      showAlert(
        VALIDATION_ERRORS.SCHEDULING_FAILED.title,
        VALIDATION_ERRORS.SCHEDULING_FAILED.message,
        [{ text: "OK", onPress: () => setAlertVisible(false) }],
        "error"
      );
    }
  };

  const createSubtasks = async (taskId: number): Promise<boolean> => {
    if (subtasks.length === 0) return true;

    try {
      let calendarFailureCount = 0;
      const CALENDAR_API_DELAY = 500;

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const subtaskPayload = [];
      for (let index = 0; index < subtasks.length; index++) {
        const subtask = subtasks[index];
        const dateStr = subtask.date || formatDateFromDate(new Date());
        const startTimeStr = subtask.startTime || "09:00";
        const endTimeStr =
          subtask.endTime ||
          calculateEndTime(startTimeStr, subtask.estimated_time);

        // Create local datetime objects
        const startDate = new Date(`${dateStr}T${startTimeStr}:00`);
        const endDate = new Date(`${dateStr}T${endTimeStr}:00`);
        
        // Convert to local time with timezone offset
        const startDateTime = toOffsetDateTime(startDate);
        const endDateTime = toOffsetDateTime(endDate);

        let googleEventId: string | undefined = undefined;
        if (subtask.startTime && subtask.endTime) {
          try {
            const event = await googleCalendarService.createEvent({
              summary: subtask.description,
              description: `Subtask of "${mainTask?.description || "Task"}". Estimated time: ${subtask.estimated_time} minutes`,
              start: {
                dateTime: toOffsetDateTime(startDate),
                timeZone: TIMEZONE,
              },
              end: {
                dateTime: toOffsetDateTime(endDate),
                timeZone: TIMEZONE,
              },
            });
            googleEventId = event?.id;

            // Add delay between API calls to respect rate limits
            if (index < subtasks.length - 1) {
              await delay(CALENDAR_API_DELAY);
            }
          } catch (error) {
            console.warn(
              `Failed to create Google Calendar event for subtask "${subtask.description}":`,
              error,
            );
            calendarFailureCount++;

            // Still add delay even on error to respect rate limits
            if (index < subtasks.length - 1) {
              await delay(CALENDAR_API_DELAY);
            }
          }
        }

        subtaskPayload.push({
          name: subtask.description,
          description: "",
          estimatedTime: subtask.estimated_time,
          duration: subtask.estimated_time,
          taskOrder: index + 1,
          task: { id: taskId },
          status: { id: 1 },
          startTime: startDateTime,
          endTime: endDateTime,
          isAiBreakdown: true,
          googleEventId,
        });
      }

     await Promise.all(
        subtaskPayload.map((subtask) =>
          createFocusFrameSubtask(subtask as any),
        ),
      );


      if (calendarFailureCount > 0) {
        console.warn(
          `Created ${subtaskPayload.length} subtasks, but ${calendarFailureCount} Google Calendar event(s) failed to create`,
        );
      }
      return true;
    } catch (error) {
      console.error("Error creating subtasks:", error);
      showAlert(
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.title,
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.message,
        [{ text: "OK", onPress: () => setAlertVisible(false) }],
        "error"
      );
      return false;
    }
  };

  const handleSaveTask = async () => {

    if (!isScheduling) {
      await handleScheduleSubtasks();
      return;
    }

    if (!validateAllInputs()) {
      return;
    }

    try {
      setIsLoading(true,"Updating the Calendar...");
      setIsSaving(true);

      const userId = await getStoredUserId();
      if (!userId) {
        showAlert(
          VALIDATION_ERRORS.USER_NOT_LINKED.title,
          VALIDATION_ERRORS.USER_NOT_LINKED.message,
          [{ text: "OK", onPress: () => setAlertVisible(false) }],
          "error"
        );
        setIsLoading(false);
        setIsSaving(false);
        return;
      }

      const createdTask = await createFocusFrameTask({
        name: mainTask?.description || "AI Breakdown Task",
        description: mainTask?.description || "",
        user: { id: userId, email: "" },
      });

      if (!createdTask?.id) {
        throw new Error("Task created without task id.");
      }

      const subtasksCreated = await createSubtasks(createdTask.id);
      if (!subtasksCreated) {
        setIsLoading(false);
        setIsSaving(false);
        return;
      }

      setIsEditing(false);
      const totalSubtaskCount = getTotalSubtaskCount(subtasks);
      const successMsg = SUCCESS_MESSAGES.SAVE_SUCCESS(
        mainTask?.description || "",
        totalSubtaskCount,
        totalTime,
      );

      showAlert(
        successMsg.title,
        successMsg.message,
        [{ text: "OK", onPress: () => { setAlertVisible(false); navigation.getParent()?.navigate("Home"); } }],
        "success"
      );
    } catch (error) {
      console.error("Error creating task:", error);
      showAlert(
        VALIDATION_ERRORS.TASK_CREATION_FAILED.title,
        VALIDATION_ERRORS.TASK_CREATION_FAILED.message,
        [{ text: "OK", onPress: () => setAlertVisible(false) }],
        "error"
      );
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  if (!result || !result.tasks || result.tasks.length === 0) {
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
          <Text style={styles.headerTitle}>AI Breakdown Results</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.divider} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={"#8AE8FF"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isScheduling ? "Schedule Subtasks" : "AI Breakdown Results"}
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.divider} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {!isEditing && (
          <View style={styles.mainTaskContainer}>
            <View style={styles.mainTaskHeader}>
              <View style={styles.mainTaskInfo}>
                <Text style={styles.mainTaskTitle}>{mainTask.description}</Text>
                <Text style={styles.mainTaskStatus}>{mainTask.status}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={18} color={"#8AE8FF"} />
                <Text style={styles.statLabel}>Total Time</Text>
                <Text style={styles.statValue}>{totalTime} min</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="list-outline" size={18} color={"#8AE8FF"} />
                <Text style={styles.statLabel}>Subtasks</Text>
                <Text style={styles.statValue}>{subtaskCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Start Time Picker Section */}
        <View
          style={{
            padding: 16,
            marginHorizontal: 16,
            marginVertical: 12,
          }}
        >
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#8AE8FF",
                marginBottom: 8,
              }}
            >
              Task Start Time
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#8AE8FF",
                opacity: 0.7,
              }}
            >
              All subtasks will be scheduled sequentially from this time
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: "rgba(138, 232, 255, 0.1)",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "rgba(138, 232, 255, 0.3)",
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onPress={() => setShowStartTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: "500",
                }}
              >
                {initialStartTime}
              </Text>
            </View>
            {hasSetStartTime && (
              <View
                style={{
                  marginLeft: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
            )}
            <Ionicons
              name="time-outline"
              size={20}
              color="#8AE8FF"
              style={{ marginLeft: hasSetStartTime ? 12 : 0 }}
            />
          </TouchableOpacity>
        </View>

        {/* DateTimePicker for Start Time */}
        {showStartTimePicker && (
          <DateTimePicker
            value={
              pendingMainStartDateTime ||
              new Date(
                `${parseDateTime(initialStartTime).date}T${parseDateTime(initialStartTime).time}:00`,
              ) ||
              new Date()
            }
            mode={startTimePickerMode}
            display="default"
            onChange={handleInitialStartTimeChange}
            is24Hour
          />
        )}

        <View style={styles.subtasksSection}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
          <View style={isEditing ? {} : styles.subtasksContainer}>
            {subtasks.map((subtask, index) => (
              <SubtaskItem
                key={index}
                subtask={subtask}
                depth={0}
                isEditing={isEditing}
                isScheduling={isScheduling}
                onUpdate={(newDescription, newTime) =>
                  handleUpdateSubtask(index, newDescription, newTime, [])
                }
                onUpdateDateTime={(startTime, endTime, date) =>
                  handleUpdateSubtaskDateTime(
                    index,
                    startTime,
                    endTime,
                    date,
                    [],
                  )
                }
                onRemove={() => handleRemoveSubtask(index, [])}
                index={index}
                parentIndices={[]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isScheduling ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isSaving || isScheduling || !hasSetStartTime) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleScheduleSubtasks}
            disabled={isSaving || isScheduling || !hasSetStartTime}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? "Saving..." : "Schedule Subtasks"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 10, flexDirection: "column", width: "100%" }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { flex: 0 },
                isSaving && { opacity: 0.6 },
              ]}
              onPress={handleSaveTask}
              disabled={isSaving}
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? "Saving..." : "Save Task"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { flex: 0, backgroundColor: "rgba(138, 232, 255, 0.1)" },
                isSaving && { opacity: 0.6 },
              ]}
              onPress={() => {
                // Reset scheduled times and go back to edit mode
                const resetSubtasks = subtasks.map((subtask) => ({
                  ...subtask,
                  startTime: undefined,
                  endTime: undefined,
                  date: undefined,
                  conflictDetected: false,
                  conflictWith: null,
                }));
                setSubtasks(resetSubtasks);
                setIsScheduling(false);
              }}
              disabled={isSaving}
            >
              <Text style={[styles.secondaryButtonText, { color: "#8AE8FF" }]}>
                Back to Edit
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <StyledAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
}
