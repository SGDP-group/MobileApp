import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { CalendarEventResponse } from "@services/googleCalendarService";
import { TaskItem } from "@services/googleTasksService";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventDescription from "./components/EventDescription";
import EventDetailModal from "./components/EventDetailModal";
import EventFormModal from "./components/EventFormModal";
import TaskDetailModal from "./components/TaskDetailModal";
import { styles } from "./styles/calendar.styles";
import { loadItems } from "./utils/dataLoader";
import {
  calculateDuration,
  formatDate,
  formatDateTime,
  formatTime,
} from "./utils/dateFormatting";
import {
  handleDeleteEvent,
  handleDeleteTask,
  saveEvent,
  saveTask,
  validateFormData,
} from "./utils/eventHandlers";
import {
  handleToggleSubtaskComplete,
  handleToggleTaskComplete,
} from "./utils/taskHandlers";
import { CombinedItem, emptyFormData } from "./utils/types";

export default function CalendarScreen() {
  // ==================== HOOKS ====================
  const navigation = useNavigation<RootNavigationProp>();

  // ==================== STATE ====================
  // Data state
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isCreateMenuVisible, setIsCreateMenuVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isTaskDetailModalVisible, setIsTaskDetailModalVisible] =
    useState(false);

  // Form state
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);

  // Detail state
  const [detailEvent, setDetailEvent] = useState<CalendarEventResponse | null>(
    null,
  );
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);

  // Edit state
  const [editingEvent, setEditingEvent] =
    useState<CalendarEventResponse | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Task UI state
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [temporarilyCompletedTasks, setTemporarilyCompletedTasks] = useState<
    Set<string>
  >(new Set());

  // ==================== EFFECTS ====================
  useEffect(() => {
    initializeItems();
  }, []);

  // ==================== DATA HANDLERS ====================
  const initializeItems = async () => {
    setIsLoading(true);
    const items = await loadItems();
    setItems(items);
    setIsLoading(false);
  };

  // ==================== NAVIGATION HANDLERS ====================
  const handleBackPress = () => {
    setIsCreateMenuVisible(false);
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Home", {});
  };

  // ==================== CREATE HANDLERS ====================
  const handleAddEvent = () => {
    setIsCreateMenuVisible(false);
    setEditingEvent(null);
    setEditingTask(null);
    setIsCreatingTask(false);
    setFormData(emptyFormData);
    setIsModalVisible(true);
  };

  const handleAddTask = () => {
    setIsCreateMenuVisible(false);
    setEditingEvent(null);
    setEditingTask(null);
    setIsCreatingTask(true);
    setFormData(emptyFormData);
    setIsModalVisible(true);
  };

  // ==================== VIEW HANDLERS ====================
  const handleViewEventDetails = (event: CalendarEventResponse) => {
    setDetailEvent(event);
    setIsDetailModalVisible(true);
  };

  const handleViewTaskDetails = (task: TaskItem) => {
    setDetailTask(task);
    setIsTaskDetailModalVisible(true);
  };

  // ==================== EDIT HANDLERS ====================
  const handleEditEvent = (event: CalendarEventResponse) => {
    setEditingEvent(event);
    setFormData({
      summary: event.summary || "",
      description: event.description || "",
      startDateTime: event.start?.dateTime || event.start?.date || "",
      endDateTime: event.end?.dateTime || event.end?.date || "",
      location: event.location || "",
    });
    setIsModalVisible(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      summary: task.title,
      description: task.notes || "",
      startDateTime: task.due || "",
      endDateTime: "",
      location: "",
    });
    setIsModalVisible(true);
  };

  // ==================== SAVE HANDLERS ====================
  const handleSaveEvent = async () => {
    if (!validateFormData(formData)) {
      return;
    }

    try {
      if (editingTask || isCreatingTask) {
        await saveTask(formData, editingTask, isCreatingTask);
      } else {
        await saveEvent(formData, editingEvent);
      }

      setIsModalVisible(false);
      setEditingEvent(null);
      setEditingTask(null);
      setIsCreatingTask(false);
      initializeItems();
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Error", "Failed to save");
    }
  };

  // ==================== DELETE HANDLERS ====================
  const handleDeleteEventWrapper = (eventId: string) => {
    handleDeleteEvent(eventId, initializeItems);
  };

  const handleDeleteTaskWrapper = (taskId: string) => {
    handleDeleteTask(taskId, initializeItems);
  };

  // ==================== TASK COMPLETION HANDLERS ====================
  const handleToggleTaskCompleteWrapper = (
    task: TaskItem & { isTask: true },
  ) => {
    handleToggleTaskComplete(task, false, initializeItems);
  };

  const handleToggleSubtaskCompleteWrapper = (
    subtask: TaskItem,
    parentTask: TaskItem & { isTask: true },
  ) => {
    handleToggleSubtaskComplete(
      subtask,
      parentTask,
      (callback) => {
        initializeItems();
        callback();
      },
      async (parentTask) => {
        await handleToggleTaskComplete(parentTask, true, initializeItems);
      },
    );
  };

  // ==================== UI INTERACTION HANDLERS ====================
  const toggleTaskExpanded = (taskId: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
    }
    setExpandedTasks(newExpandedTasks);
  };

  const handleStartNow = (item: CombinedItem) => {
    const isTask = "isTask" in item && item.isTask;
    const title = isTask
      ? (item as TaskItem).title
      : (item as CalendarEventResponse).summary;
    Alert.alert("Start Now", `Starting: ${title}`, [{ text: "OK" }]);
  };

  // ==================== RENDER HELPERS ====================
  const renderEventItem = ({ item }: { item: CombinedItem }) => {
    const isTask = "isTask" in item && item.isTask;
    const event = item as CalendarEventResponse;
    const task = item as TaskItem & { isTask: true };
    const isExpanded = isTask && expandedTasks.has(task.id);
    const hasSubtasks = isTask && task.subtasks && task.subtasks.length > 0;
    const isTemporarilyCompleted =
      isTask && temporarilyCompletedTasks.has(task.id);
    const isTaskCompleted =
      isTask && (task.completed || isTemporarilyCompleted);
    const taskEndDateTime = isTask ? task.endDateTime || task.due : undefined;

    return (
      <View style={styles.tasksContainer}>
        <View
          style={[
            styles.eventCard,
            isTask && styles.taskCard,
            isTaskCompleted && styles.completedCard,
          ]}
        >
          <View style={styles.mainTaskRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (!isTask) {
                  handleViewEventDetails(event);
                } else if (isTask) {
                  handleViewTaskDetails(task);
                }
              }}
              onLongPress={() => {
                if (isTask) {
                  handleViewTaskDetails(task);
                }
              }}
              style={{ flexDirection: "row", flex: 1 }}
            >
              <View style={styles.eventContent}>
                <View style={styles.itemHeader}>
                  {hasSubtasks && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleTaskExpanded(task.id);
                      }}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color="#007AFF"
                        style={styles.chevron}
                      />
                    </TouchableOpacity>
                  )}
                  <Text
                    style={[
                      styles.eventTitle,
                      isTaskCompleted && styles.completedText,
                    ]}
                  >
                    {isTask ? task.title : event.summary}
                  </Text>
                  {isTask && (
                    <View style={styles.taskBadge}>
                      <Text style={styles.taskBadgeText}>Task</Text>
                    </View>
                  )}
                </View>
                {!isTask && event.description && (
                  <EventDescription html={event.description} />
                )}
                {isTask && task.notes && (
                  <Text
                    style={styles.eventDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {task.notes}
                  </Text>
                )}

                {/* Start Session At / Due Date */}
                {!isTask && event.start?.dateTime && (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color="#3FD3FF" />
                    <Text style={styles.metaLabel}>Start Session: </Text>
                    <Text style={styles.metaValue}>
                      {formatTime(event.start.dateTime)}
                    </Text>
                  </View>
                )}
                {isTask && taskEndDateTime && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#FF9500"
                    />
                    <Text style={styles.metaLabel}>Due Date: </Text>
                    <Text style={styles.metaValue}>
                      {formatDate(taskEndDateTime)}
                    </Text>
                  </View>
                )}

                {/* Duration (for events only) */}
                {!isTask && event.start?.dateTime && event.end?.dateTime && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="hourglass-outline"
                      size={14}
                      color="#3FD3FF"
                    />
                    <Text style={styles.metaLabel}>Duration: </Text>
                    <Text style={styles.metaValue}>
                      {calculateDuration(
                        event.start.dateTime,
                        event.end.dateTime,
                      )}
                    </Text>
                  </View>
                )}

                {/* Location */}
                {!isTask && event.location && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#3FD3FF"
                    />
                    <Text style={styles.metaLabel}>Location: </Text>
                    <Text style={styles.metaValue}>{event.location}</Text>
                  </View>
                )}

                <View style={styles.bottomRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      if (isTask) {
                        handleEditTask(task);
                      } else {
                        handleEditEvent(event);
                      }
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartNow(item)}
                  >
                    <Text style={styles.startButtonText}>START NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {isTask && (
                <TouchableOpacity
                  onPress={() => handleToggleTaskCompleteWrapper(task)}
                  style={styles.checkboxContainerRight}
                >
                  <Ionicons
                    name={
                      isTaskCompleted ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={24}
                    color={isTaskCompleted ? "#34C759" : "#C7C7CC"}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {/* <View style={styles.eventActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    if (isTask) {
                      handleDeleteTaskWrapper(task.id);
                    } else {
                      handleDeleteEventWrapper(event.id);
                    }
                  }}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  if (isTask) {
                    handleDeleteTaskWrapper(task.id);
                  } else {
                    handleDeleteEventWrapper(event.id);
                  }
                }}
              >
                <Ionicons name="trash" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View> */}
          </View>

          {/* Render Subtasks */}
          {isExpanded && hasSubtasks && (
            <View style={styles.subtasksContainer}>
              {task.subtasks!.map((subtask) => (
                <View
                  key={subtask.id}
                  style={[
                    styles.subtaskItem,
                    subtask.completed && styles.completedCard,
                  ]}
                >
                  <View style={styles.subtaskContent}>
                    <Text
                      style={[
                        styles.subtaskTitle,
                        subtask.completed && styles.completedText,
                      ]}
                    >
                      {subtask.title}
                    </Text>
                    {subtask.notes && (
                      <Text style={styles.subtaskNotes}>{subtask.notes}</Text>
                    )}
                    {(subtask.endDateTime || subtask.due) && (
                      <View style={styles.metaRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#FF9500"
                        />
                        <Text style={styles.metaLabel}>Due: </Text>
                        <Text style={styles.metaValue}>
                          {formatDate(subtask.endDateTime || subtask.due)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleToggleSubtaskCompleteWrapper(subtask, task)
                    }
                    style={styles.checkboxContainerRight}
                  >
                    <Ionicons
                      name={
                        subtask.completed
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={20}
                      color={subtask.completed ? "#34C759" : "#C7C7CC"}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Queue</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreateMenuVisible((prev) => !prev)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          {isCreateMenuVisible && (
            <View style={styles.createMenu}>
              <TouchableOpacity
                style={styles.createMenuItem}
                onPress={handleAddTask}
              >
                <Text style={styles.createMenuItemText}>Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createMenuItem}
                onPress={handleAddEvent}
              >
                <Text style={styles.createMenuItemText}>Event</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.text}
            style={styles.loadingIndicator}
          />
          <Text style={styles.emptyText}>Loading events and tasks...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No upcoming events or tasks</Text>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={handleAddEvent}
          >
            <Text style={styles.addEventButtonText}>Add Your First Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={initializeItems}
        />
      )}

      {/* Detail Modal */}
      <EventDetailModal
        visible={isDetailModalVisible}
        event={detailEvent}
        onClose={() => setIsDetailModalVisible(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEventWrapper}
        formatDateTime={formatDateTime}
      />

      <TaskDetailModal
        visible={isTaskDetailModalVisible}
        task={detailTask}
        onClose={() => setIsTaskDetailModalVisible(false)}
        onEdit={handleEditTask}
        onDelete={handleDeleteTaskWrapper}
        formatDate={formatDate}
      />

      {/* Form Modal */}
      <EventFormModal
        visible={isModalVisible}
        editingEvent={editingEvent}
        formData={formData}
        onClose={() => setIsModalVisible(false)}
        onFormDataChange={setFormData}
        onSave={handleSaveEvent}
      />
    </SafeAreaView>
  );
}
