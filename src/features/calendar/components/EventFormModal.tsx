import { CalendarEventResponse } from "@services/googleCalendarService";
import React from "react";
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/calendar.styles";

interface FormData {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
}

interface EventFormModalProps {
  visible: boolean;
  editingEvent: CalendarEventResponse | null;
  formData: FormData;
  onClose: () => void;
  onFormDataChange: (data: FormData) => void;
  onSave: () => void;
}

export default function EventFormModal({
  visible,
  editingEvent,
  formData,
  onClose,
  onFormDataChange,
  onSave,
}: EventFormModalProps) {
  const handleInputChange = (field: keyof FormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingEvent ? "Edit Event" : "New Event"}
          </Text>
          <TouchableOpacity onPress={onSave}>
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
              onChangeText={(text) => handleInputChange("summary", text)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter event description"
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
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
              onChangeText={(text) => handleInputChange("startDateTime", text)}
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
              onChangeText={(text) => handleInputChange("endDateTime", text)}
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
              onChangeText={(text) => handleInputChange("location", text)}
              placeholderTextColor="#999"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
