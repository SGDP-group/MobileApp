import Ionicons from "@expo/vector-icons/Ionicons";
import {
  CalendarEventResponse,
  googleCalendarService,
} from "@services/googleCalendarService";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventDescription from "./components/EventDescription";
import EventDetailModal from "./components/EventDetailModal";
import EventFormModal from "./components/EventFormModal";
import { styles } from "./styles/calendar.styles";

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEventResponse | null>(
    null,
  );
  const [editingEvent, setEditingEvent] =
    useState<CalendarEventResponse | null>(null);
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const calendarEvents = await googleCalendarService.listEvents(20);
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      Alert.alert("Error", "Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
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
      Alert.alert("Validation", "Event title is required");
      return;
    }

    if (!formData.startDateTime.trim()) {
      Alert.alert("Validation", "Start date/time is required");
      return;
    }

    try {
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

      if (editingEvent) {
        await googleCalendarService.updateEvent(editingEvent.id, eventData);
        Alert.alert("Success", "Event updated successfully");
      } else {
        await googleCalendarService.createEvent(eventData);
        Alert.alert("Success", "Event created successfully");
      }

      setIsModalVisible(false);
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      Alert.alert("Error", "Failed to save event");
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
            loadEvents();
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

  const renderEventItem = ({ item }: { item: CalendarEventResponse }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleViewEventDetails(item)}
    >
      <View style={styles.eventCard}>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.summary}</Text>
          {item.description && <EventDescription html={item.description} />}
          <Text style={styles.eventTime}>
            {formatDateTime(item.start?.dateTime)}
          </Text>
          {item.location && (
            <Text style={styles.eventLocation}>📍 {item.location}</Text>
          )}
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditEvent(item)}
          >
            <Ionicons name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteEvent(item.id)}
          >
            <Ionicons name="trash" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Google Calendar</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No upcoming events</Text>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={handleAddEvent}
          >
            <Text style={styles.addEventButtonText}>Add Your First Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={loadEvents}
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
