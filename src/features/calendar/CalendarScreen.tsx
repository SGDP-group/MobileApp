import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTaskById, updateTask } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { HomeTask, useHomeTasks } from "../home/home.tasks";
import { formatTaskLeadMeta, formatTaskTimestamp } from "../home/utils/home.helpers";
import { CalendarTaskListSection } from "./components/CalendarTaskListSection";
import { TaskQueueHeader } from "./components/TaskQueueHeader";
import { TaskQueueModal } from "./components/EditableTaskQueueModal";
import { styles } from "./styles/calendar.styles";
import type { CalendarTaskItem } from "./utils/calender.types";


export default function CalendarScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { upNextData, refreshTasks } = useHomeTasks();
  const [taskQueueModalVisible, setTaskQueueModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HomeTask | null>(null);

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
    const taskEntry = upNextData.find(
      (entry) => entry.type === "task" && String(entry.task.id) === item.id,
    );
    setSelectedTask(taskEntry && taskEntry.type === "task" ? taskEntry.task : null);
    setTaskQueueModalVisible(true);
  };

  const handleCloseTaskQueue = () => {
    setTaskQueueModalVisible(false);
  };

  const handleEditTask = async (
    task: HomeTask,
    updates: { name: string; description?: string },
  ) => {
    const storedUserId = await getStoredUserId();
    const resolvedUserId = task.userId ?? task.user?.id ?? storedUserId ?? undefined;

    await updateTask(task.id, {
      name: updates.name,
      userId: resolvedUserId,
      description: updates.description,
    });

    const refreshedTask = await getTaskById(task.id);

    setSelectedTask(refreshedTask as HomeTask);

    await refreshTasks();
  };

  const handleDeleteTask = (task: HomeTask) => {
    Alert.alert("Delete Task", `Delete: ${task.name}`);
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

      <TaskQueueModal
        visible={taskQueueModalVisible}
        task={selectedTask}
        onClose={handleCloseTaskQueue}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />
    </SafeAreaView>
  );
}

