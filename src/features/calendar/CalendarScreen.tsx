import Ionicons from "@expo/vector-icons/Ionicons";
import {
  CalendarEventResponse,
  googleCalendarService,
} from "@services/googleCalendarService";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventDescription from "./components/EventDescription";
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

      {/* Modal for viewing event details */}
      <Modal
        visible={isDetailModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.detailModalTitle}>Event Details</Text>
              <View style={styles.detailModalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setIsDetailModalVisible(false);
                    detailEvent && handleEditEvent(detailEvent);
                  }}
                >
                  <Ionicons name="pencil" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (detailEvent) {
                      setIsDetailModalVisible(false);
                      handleDeleteEvent(detailEvent.id);
                    }
                  }}
                >
                  r
                  <Ionicons name="trash" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.detailModalBody}>
              {detailEvent && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Title</Text>
                    <Text style={styles.detailTitle}>
                      {detailEvent.summary}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailText}>
                      {formatDateTime(detailEvent.start?.dateTime)}
                    </Text>
                  </View>

                  {detailEvent.location && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailText}>
                        {detailEvent.location}
                      </Text>
                    </View>
                  )}

                  {detailEvent.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <EventDescription
                        html={detailEvent.description}
                        showFull={true}
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal for creating/editing events */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEvent ? "Edit Event" : "New Event"}
            </Text>
            <TouchableOpacity onPress={handleSaveEvent}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                value={formData.summary}
                onChangeText={(text) =>
                  setFormData({ ...formData, summary: text })
                }
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event description"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={6}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Start Date & Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-02-05T10:00:00"
                value={formData.startDateTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, startDateTime: text })
                }
                placeholderTextColor="#999"
              />
              <Text style={styles.hint}>Format: YYYY-MM-DDTHH:MM:SS</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>End Date & Time</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-02-05T11:00:00"
                value={formData.endDateTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, endDateTime: text })
                }
                placeholderTextColor="#999"
              />
              <Text style={styles.hint}>Format: YYYY-MM-DDTHH:MM:SS</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter location"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
