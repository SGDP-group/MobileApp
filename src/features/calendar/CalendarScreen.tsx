import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarTaskListSection } from "./components/CalendarTaskListSection";
import { TaskQueueHeader } from "./components/TaskQueueHeader";
import { useHomeTasks } from "../home/home.tasks";
import { formatTaskLeadMeta, formatTaskTimestamp } from "../home/utils/home.helpers";
import type { CalendarTaskItem } from "./utils/calender.types";
import { styles } from "./styles/calendar.styles";


export default function CalendarScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { upNextData, refreshTasks } = useHomeTasks();

  useFocusEffect(
    useCallback(() => {
      void refreshTasks();
    }, [refreshTasks]),
  );

  const items = useMemo<CalendarTaskItem[]>(() => {
    return upNextData
      .filter((entry) => entry.type === "task")
      .map((entry) => {
        const task = entry.task;
        const taskLead = formatTaskLeadMeta(task);
        const leadStatus =
          taskLead.status === "late"
            ? "late"
            : taskLead.status === "upcoming"
              ? "upcoming"
              : "none";
        const taskStartTimestamp = taskLead.startDateOfIncompleteSubtask
          ? formatTaskTimestamp(taskLead.startDateOfIncompleteSubtask.toISOString())
          : formatTaskTimestamp(task.updatedAt);

        return {
          id: String(task.id),
          title: task.name,
          notes: task.description,
          due: task.deadline,
          leadLabel: taskLead.label,
          leadStatus,
          metaText: `Start ${taskStartTimestamp}`,
          completed: false,
          subtasks: (task.subTasks ?? []).map((subtask) => ({
            id: String(subtask.id),
            title: subtask.name,
            notes: subtask.description,
            due: subtask.endTime,
            completed: Boolean(subtask.completed),
          })),
        };
      });
  }, [upNextData]);

  const isLoading = upNextData.some((entry) => entry.type === "loading");

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Home", {});
  };

  const handleAddTask = () => {
    navigation.navigate("AddTask");
  };

  const handleOpenTaskQueue = (item: CalendarTaskItem) => {
    if (item) {
      Alert.alert("Task Queue", `Open task queue for: ${item.title}`, [{ text: "OK" }]);
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TaskQueueHeader
        onBackPress={handleBackPress}
        onAddTaskPress={handleAddTask}
      />

      <CalendarTaskListSection
        isLoading={isLoading}
        items={items}
        onRefresh={refreshTasks}
        onAddTaskPress={handleAddTask}
        onOpenTaskQueue={handleOpenTaskQueue}
      />

      <BottomNav activeRoute="Calendar" />
    </SafeAreaView>
  );
}

