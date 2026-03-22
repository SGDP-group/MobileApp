import Ionicons from "@expo/vector-icons/Ionicons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { createSubtask as createFocusFrameSubtask } from "@services/focusFrameSubtaskService";
import { createTask as createFocusFrameTask } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import {
    RootNavigationProp,
    RootStackParamList,
} from "@shared/navigation/RootNavigator";
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
import { styles as detailsStyles } from "./styles/addTaskDetails.styles";
import { styles } from "./styles/aiBreakdownResult.styles";

interface Subtask {
  description: string;
  status: "pending" | "completed";
  estimated_time: number;
  subtasks: Subtask[];
}

interface Task {
  description: string;
  status: "pending" | "completed";
  estimated_time: number;
  subtasks: Subtask[];
}

interface AIBreakdownResult {
  success: boolean;
  message: string;
  tasks: Task[];
  user_id: string;
}

// Validation error messages
const VALIDATION_ERRORS = {
  NO_SUBTASKS: {
    title: "No Subtasks",
    message: "Please ensure you have at least one subtask",
  },
  EMPTY_DESCRIPTION: {
    title: "Validation Error",
    message: "Please enter a description",
  },
  EMPTY_TIME: {
    title: "Validation Error",
    message: "Please enter estimated time",
  },
  INVALID_TIME: {
    title: "Validation Error",
    message: "Time must be a number",
  },
  INVALID_TIME_VALUE: {
    title: "Validation Error",
    message: "Time must be greater than 0",
  },
  INVALID_SUBTASK_TIME: (index: number) => ({
    title: "Invalid Input",
    message: `Subtask ${index + 1}: Please enter a valid time in minutes`,
  }),
  SAVE_FAILED: {
    title: "Error",
    message: "Failed to save task. Please try again.",
  },
  USER_NOT_LINKED: {
    title: "User Not Linked",
    message: "Please sign in to save tasks.",
  },
  TASK_CREATION_FAILED: {
    title: "Task Creation Failed",
    message: "Failed to create task. Please try again.",
  },
  SUBTASK_CREATION_FAILED: {
    title: "Subtask Creation Failed",
    message: "Failed to create some subtasks. Please try again.",
  },
};

// Success messages
const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: (description: string, count: number, totalTime: number) => ({
    title: "Success",
    message: `Task "${description}" has been saved with ${count} subtasks\n\nTotal estimated time: ${totalTime} minutes`,
  }),
};

// Helper function to get duration display
const getDurationDisplay = (time: number | string): string => {
  const parsedTime = typeof time === "string" ? parseInt(time, 10) : time;
  return isNaN(parsedTime) || parsedTime <= 0 ? "--" : parsedTime.toString();
};

// Helper function to validate subtask time
const validateSubtaskTime = (time: string): boolean => {
  if (time.trim() === "") {
    Alert.alert(
      VALIDATION_ERRORS.EMPTY_TIME.title,
      VALIDATION_ERRORS.EMPTY_TIME.message,
    );
    return false;
  }
  const parsedTime = parseInt(time, 10);
  if (isNaN(parsedTime)) {
    Alert.alert(
      VALIDATION_ERRORS.INVALID_TIME.title,
      VALIDATION_ERRORS.INVALID_TIME.message,
    );
    return false;
  }
  if (parsedTime <= 0) {
    Alert.alert(
      VALIDATION_ERRORS.INVALID_TIME_VALUE.title,
      VALIDATION_ERRORS.INVALID_TIME_VALUE.message,
    );
    return false;
  }
  return true;
};

// Helper function to validate subtask description
const validateSubtaskDescription = (description: string): boolean => {
  if (!description.trim()) {
    Alert.alert(
      VALIDATION_ERRORS.EMPTY_DESCRIPTION.title,
      VALIDATION_ERRORS.EMPTY_DESCRIPTION.message,
    );
    return false;
  }
  return true;
};

const SubtaskItem: React.FC<{
  subtask: Subtask;
  depth: number;
  isEditing: boolean;
  onUpdate: (newDescription: string, newTime: number) => void;
  onRemove: () => void;
  index: number;
  parentIndices?: number[];
}> = ({
  subtask,
  depth,
  isEditing,
  onUpdate,
  onRemove,
  index,
  parentIndices = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(subtask.description);
  const [estimatedTime, setEstimatedTime] = useState(
    subtask.estimated_time.toString(),
  );
  const hasNestedSubtasks = subtask.subtasks && subtask.subtasks.length > 0;
  const paddingLeft = depth * 16;

  const handleTimeChange = (newTime: string) => {
    setEstimatedTime(newTime);

    // Validate all fields before updating
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

    // Validate all fields before updating
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
              numberOfLines={2}
            >
              {subtask.description}
            </Text>
          </View>
        </View>

        <View style={styles.subtaskRight}>
          <Text style={styles.estimatedTime}>{subtask.estimated_time}m</Text>
        </View>
      </TouchableOpacity>

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
            />
          </View>

          <Text style={detailsStyles.helperText}>
            Duration: {getDurationDisplay(estimatedTime)} min
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => {
                if (
                  !validateSubtaskDescription(description) ||
                  !validateSubtaskTime(estimatedTime)
                ) {
                  return;
                }
                setExpanded(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={onRemove}
            >
              <Text style={styles.primaryButtonText}>Remove</Text>
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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    result?.tasks[0]?.subtasks || [],
  );

  const mainTask = result?.tasks[0];
  const totalTime = useMemo(
    () => subtasks.reduce((sum, st) => sum + st.estimated_time, 0),
    [subtasks],
  );
  const subtaskCount = useMemo(() => subtasks.length, [subtasks]);

  const validateSubtasksExist = (): boolean => {
    if (subtaskCount === 0) {
      Alert.alert(
        VALIDATION_ERRORS.NO_SUBTASKS.title,
        VALIDATION_ERRORS.NO_SUBTASKS.message,
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
          Alert.alert(
            VALIDATION_ERRORS.INVALID_SUBTASK_TIME(i).title,
            `Subtask ${indexDisplay}: Please enter a valid time in minutes`,
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

  const handleRemoveSubtask = (index: number, parentIndices: number[] = []) => {
    Alert.alert(
      "Remove Subtask",
      "Are you sure you want to remove this subtask?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Remove",
          onPress: () => {
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
    );
  };

  const getTotalSubtaskCount = (items: Subtask[]): number => {
    return items.reduce(
      (sum, item) =>
        sum + 1 + (item.subtasks ? getTotalSubtaskCount(item.subtasks) : 0),
      0,
    );
  };

  const createSubtasks = async (taskId: number): Promise<boolean> => {
    if (subtasks.length === 0) return true;

    try {
      const subtaskPayload = subtasks.map((subtask, index) => ({
        name: subtask.description,
        description: "",
        estimated_time: subtask.estimated_time,
        duration: subtask.estimated_time,
        taskOrder: index + 1,
        task: { id: taskId },
        status: { id: 1 },
        startTime: new Date().toISOString(),
        endTime: new Date(
          Date.now() + subtask.estimated_time * 60 * 1000,
        ).toISOString(),
      }));

      await Promise.all(
        subtaskPayload.map((subtask) =>
          createFocusFrameSubtask(subtask as any),
        ),
      );
      return true;
    } catch (error) {
      console.error("Error creating subtasks:", error);
      Alert.alert(
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.title,
        VALIDATION_ERRORS.SUBTASK_CREATION_FAILED.message,
      );
      return false;
    }
  };

  const handleSaveTask = async () => {
    if (!validateAllInputs()) {
      return;
    }

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

      const createdTask = await createFocusFrameTask({
        name: mainTask?.description || "AI Breakdown Task",
        description: mainTask?.description || "",
        user: { id: userId, email: "" },
      });

      if (!createdTask?.id) {
        throw new Error("Task created without task id.");
      }

      const subtasksCreated = await createSubtasks(createdTask.id);
      if (!subtasksCreated) return;

      setIsEditing(false);
      const totalSubtaskCount = getTotalSubtaskCount(subtasks);
      const successMsg = SUCCESS_MESSAGES.SAVE_SUCCESS(
        mainTask?.description || "",
        totalSubtaskCount,
        totalTime,
      );

      Alert.alert(successMsg.title, successMsg.message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
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
          {isEditing ? "Edit Subtasks" : "AI Breakdown Results"}
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
              <View
                style={[
                  styles.mainStatusCircle,
                  {
                    backgroundColor:
                      mainTask.status === "completed"
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {mainTask.status === "completed" && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.background}
                  />
                )}
              </View>
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

        <View style={styles.subtasksSection}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
          <View style={isEditing ? {} : styles.subtasksContainer}>
            {subtasks.map((subtask, index) => (
              <SubtaskItem
                key={index}
                subtask={subtask}
                depth={0}
                isEditing={isEditing}
                onUpdate={(newDescription, newTime) =>
                  handleUpdateSubtask(index, newDescription, newTime, [])
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
        <TouchableOpacity
          style={[styles.primaryButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSaveTask}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Saving..." : "Save Task"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
