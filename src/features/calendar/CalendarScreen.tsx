import Ionicons from "@expo/vector-icons/Ionicons";
import {
  CalendarEventResponse,
  googleCalendarService,
} from "@services/googleCalendarService";
import { TaskItem, googleTasksService } from "@services/googleTasksService";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventDescription from "./components/EventDescription";
import EventDetailModal from "./components/EventDetailModal";
import EventFormModal from "./components/EventFormModal";
import { styles } from "./styles/calendar.styles";

type CombinedItem = CalendarEventResponse | (TaskItem & { isTask: true });

export default function CalendarScreen() {
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEventResponse | null>(
    null,
  );
  const [editingEvent, setEditingEvent] =
    useState<CalendarEventResponse | null>(null);
  const [editingTask, setEditingTask] = useState<
    (TaskItem & { isTask: true }) | null
  >(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [temporarilyCompletedTasks, setTemporarilyCompletedTasks] = useState<
    Set<string>
  >(new Set());
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const [calendarEvents, tasks] = await Promise.all([
        googleCalendarService.listEvents(20),
        googleTasksService.getTasks(20),
      ]);

      const combinedItems: CombinedItem[] = [
        ...calendarEvents,
        ...tasks.map((task) => ({ ...task, isTask: true as const })),
      ];

      // Sort by start date/time or due date
      combinedItems.sort((a, b) => {
        const dateA =
          (a as CalendarEventResponse).start?.dateTime ||
          (a as TaskItem & { isTask: true }).due ||
          "";
        const dateB =
          (b as CalendarEventResponse).start?.dateTime ||
          (b as TaskItem & { isTask: true }).due ||
          "";
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

      setItems(combinedItems);
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load calendar events and tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEditingTask(null);
    setIsCreatingTask(false);
    setFormData({
      summary: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
    });
    setIsModalVisible(true);
  };

  const handleAddTask = () => {
    setEditingEvent(null);
    setEditingTask(null);
    setIsCreatingTask(true);
    setFormData({
      summary: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
    });
    setIsModalVisible(true);
  };

  const handleViewEventDetails = (event: CalendarEventResponse) => {
    setDetailEvent(event);
    setIsDetailModalVisible(true);
  };

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

  const handleSaveEvent = async () => {
    if (!formData.summary.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    if (!formData.startDateTime.trim()) {
      Alert.alert("Validation", "Date is required");
      return;
    }

    try {
      // Handle task save/update
      if (editingTask) {
        await googleTasksService.updateTask(editingTask.id, {
          title: formData.summary,
          notes: formData.description,
          due: formData.startDateTime,
        });
        Alert.alert("Success", "Task updated successfully");
      } else if (isCreatingTask) {
        // Create new task
        await googleTasksService.createTask(
          formData.summary,
          formData.description,
          formData.startDateTime,
        );
        Alert.alert("Success", "Task created successfully");
      } else if (editingEvent) {
        // Handle event update
        const eventData = {
          summary: formData.summary,
          description: formData.description,
          location: formData.location,
          start: {
            dateTime: formData.startDateTime,
            timeZone: "UTC",
          },
          end: {
            dateTime: formData.endDateTime || formData.startDateTime,
            timeZone: "UTC",
          },
        };
        await googleCalendarService.updateEvent(editingEvent.id, eventData);
        Alert.alert("Success", "Event updated successfully");
      } else {
        // Handle new event creation
        const eventData = {
          summary: formData.summary,
          description: formData.description,
          location: formData.location,
          start: {
            dateTime: formData.startDateTime,
            timeZone: "UTC",
          },
          end: {
            dateTime: formData.endDateTime || formData.startDateTime,
            timeZone: "UTC",
          },
        };
        await googleCalendarService.createEvent(eventData);
        Alert.alert("Success", "Event created successfully");
      }

      setIsModalVisible(false);
      setEditingEvent(null);
      setEditingTask(null);
      setIsCreatingTask(false);
      loadItems();
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Error", "Failed to save");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await googleCalendarService.deleteEvent(eventId);
            Alert.alert("Success", "Event deleted successfully");
            loadItems();
          } catch (error) {
            console.error("Error deleting event:", error);
            Alert.alert("Error", "Failed to delete event");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const calculateDuration = (
    start: string | undefined,
    end: string | undefined,
  ): string => {
    if (!start || !end) return "";
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return "";
    }
  };

  const handleEditTask = (task: TaskItem & { isTask: true }) => {
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

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await googleTasksService.deleteTask(taskId);
            Alert.alert("Success", "Task deleted successfully");
            loadItems();
          } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("Error", "Failed to delete task");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
    }
    setExpandedTasks(newExpandedTasks);
  };

  const handleToggleSubtaskComplete = async (
    subtask: TaskItem,
    parentTask: TaskItem & { isTask: true },
  ) => {
    const action = subtask.completed
      ? "mark as incomplete"
      : "mark as complete";

    Alert.alert("Update Subtask", `Do you want to ${action} this subtask?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await googleTasksService.updateTask(subtask.id, {
              ...subtask,
              completed: !subtask.completed,
            });

            // Check if all subtasks are completed
            const allSubtasksCompleted = parentTask.subtasks?.every((st) =>
              st.id === subtask.id ? !subtask.completed : st.completed,
            );

            if (
              allSubtasksCompleted &&
              parentTask.subtasks &&
              parentTask.subtasks.length > 0
            ) {
              // Temporarily mark parent as completed
              const newTempCompleted = new Set(temporarilyCompletedTasks);
              newTempCompleted.add(parentTask.id);
              setTemporarilyCompletedTasks(newTempCompleted);

              Alert.alert(
                "All Subtasks Completed",
                "All subtasks are completed. Do you want to mark the main task as complete?",
                [
                  {
                    text: "Not Yet",
                    onPress: () => {
                      const newTempCompleted = new Set(
                        temporarilyCompletedTasks,
                      );
                      newTempCompleted.delete(parentTask.id);
                      setTemporarilyCompletedTasks(newTempCompleted);
                    },
                  },
                  {
                    text: "Complete",
                    onPress: async () => {
                      await handleToggleTaskComplete(parentTask, true);
                    },
                  },
                ],
              );
            }

            loadItems();
          } catch (error) {
            console.error("Error toggling subtask:", error);
            Alert.alert("Error", "Failed to update subtask");
          }
        },
      },
    ]);
  };

  const handleToggleTaskComplete = async (
    task: TaskItem & { isTask: true },
    skipConfirmation: boolean = false,
  ) => {
    const action = task.completed ? "mark as incomplete" : "mark as complete";

    if (!skipConfirmation) {
      if (!task.completed && task.subtasks && task.subtasks.length > 0) {
        // Completing main task - ask for confirmation to complete all subtasks
        Alert.alert(
          "Complete Task",
          "Do you want to mark all subtasks as complete too?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Task Only",
              onPress: async () => {
                try {
                  await googleTasksService.updateTask(task.id, {
                    ...task,
                    completed: true,
                  });
                  const newTempCompleted = new Set(temporarilyCompletedTasks);
                  newTempCompleted.delete(task.id);
                  setTemporarilyCompletedTasks(newTempCompleted);
                  loadItems();
                } catch (error) {
                  console.error("Error completing task:", error);
                  Alert.alert("Error", "Failed to complete task");
                }
              },
            },
            {
              text: "All",
              onPress: async () => {
                try {
                  // Complete main task
                  await googleTasksService.updateTask(task.id, {
                    ...task,
                    completed: true,
                  });

                  // Complete all subtasks
                  if (task.subtasks) {
                    await Promise.all(
                      task.subtasks.map((subtask) =>
                        googleTasksService.updateTask(subtask.id, {
                          ...subtask,
                          completed: true,
                        }),
                      ),
                    );
                  }

                  const newTempCompleted = new Set(temporarilyCompletedTasks);
                  newTempCompleted.delete(task.id);
                  setTemporarilyCompletedTasks(newTempCompleted);
                  loadItems();
                } catch (error) {
                  console.error("Error completing task and subtasks:", error);
                  Alert.alert("Error", "Failed to complete task");
                }
              },
            },
          ],
        );
      } else {
        // Simple toggle with confirmation
        Alert.alert("Update Task", `Do you want to ${action} this task?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              try {
                await googleTasksService.updateTask(task.id, {
                  ...task,
                  completed: !task.completed,
                });
                const newTempCompleted = new Set(temporarilyCompletedTasks);
                newTempCompleted.delete(task.id);
                setTemporarilyCompletedTasks(newTempCompleted);
                loadItems();
              } catch (error) {
                console.error("Error toggling task:", error);
                Alert.alert("Error", "Failed to update task");
              }
            },
          },
        ]);
      }
    } else {
      // Skip confirmation (called from subtask completion)
      try {
        await googleTasksService.updateTask(task.id, {
          ...task,
          completed: !task.completed,
        });
        const newTempCompleted = new Set(temporarilyCompletedTasks);
        newTempCompleted.delete(task.id);
        setTemporarilyCompletedTasks(newTempCompleted);
        loadItems();
      } catch (error) {
        console.error("Error toggling task:", error);
        Alert.alert("Error", "Failed to update task");
      }
    }
  };

  const handleStartNow = (item: CombinedItem) => {
    const isTask = "isTask" in item && item.isTask;
    const title = isTask
      ? (item as TaskItem).title
      : (item as CalendarEventResponse).summary;
    Alert.alert("Start Now", `Starting: ${title}`, [{ text: "OK" }]);
  };

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
                if (isTask && hasSubtasks) {
                  toggleTaskExpanded(task.id);
                } else if (!isTask) {
                  handleViewEventDetails(event);
                }
              }}
              style={{ flexDirection: "row", flex: 1 }}
            >
              {isTask && (
                <TouchableOpacity
                  onPress={() => handleToggleTaskComplete(task)}
                  style={styles.checkboxContainer}
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
              <View style={styles.eventContent}>
                <View style={styles.itemHeader}>
                  {hasSubtasks && (
                    <Ionicons
                      name={isExpanded ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color="#007AFF"
                      style={styles.chevron}
                    />
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
                  <Text style={styles.eventDescription}>{task.notes}</Text>
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
                {isTask && task.due && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#FF9500"
                    />
                    <Text style={styles.metaLabel}>Due Date: </Text>
                    <Text style={styles.metaValue}>{formatDate(task.due)}</Text>
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
                    style={styles.startButton}
                    onPress={() => handleStartNow(item)}
                  >
                    <Text style={styles.startButtonText}>START NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.eventActions}>
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
                style={styles.deleteButton}
                onPress={() => {
                  if (isTask) {
                    handleDeleteTask(task.id);
                  } else {
                    handleDeleteEvent(event.id);
                  }
                }}
              >
                <Ionicons name="trash" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
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
                  <TouchableOpacity
                    onPress={() => handleToggleSubtaskComplete(subtask, task)}
                    style={styles.checkboxContainer}
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
                    {subtask.due && (
                      <Text style={styles.subtaskTime}>
                        {formatDateTime(subtask.due)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Google Calendar</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Loading events and tasks...</Text>
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
          onRefresh={loadItems}
        />
      )}

      {/* Detail Modal */}
      <EventDetailModal
        visible={isDetailModalVisible}
        event={detailEvent}
        onClose={() => setIsDetailModalVisible(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        formatDateTime={formatDateTime}
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
