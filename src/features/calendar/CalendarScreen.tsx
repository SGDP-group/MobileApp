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

  const renderEventItem = ({ item }: { item: CombinedItem }) => {
    const isTask = "isTask" in item && item.isTask;
    const event = item as CalendarEventResponse;
    const task = item as TaskItem & { isTask: true };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !isTask && handleViewEventDetails(event)}
      >
        <View style={[styles.eventCard, isTask && styles.taskCard]}>
          <View style={styles.eventContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.eventTitle}>
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
            <Text style={styles.eventTime}>
              {isTask
                ? formatDateTime(task.due)
                : formatDateTime(event.start?.dateTime)}
            </Text>
            {!isTask && event.location && (
              <Text style={styles.eventLocation}>📍 {event.location}</Text>
            )}
          </View>
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
      </TouchableOpacity>
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
