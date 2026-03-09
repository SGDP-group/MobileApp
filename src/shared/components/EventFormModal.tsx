import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarEventResponse } from "@services/googleCalendarService";
import { styles } from "@shared/styles/EventFormModal.styles";
import { colors } from "@shared/theme/colors";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RepeatModal, { RecurrenceData } from "./RepeatModal";

interface FormData {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  recurrence?: RecurrenceData;
}

interface EventFormModalProps {
  visible: boolean;
  editingEvent: CalendarEventResponse | null;
  formData: FormData;
  onClose: () => void;
  onFormDataChange: (data: FormData) => void;
  onSave: () => void;
}

type PickerField = "start" | "end";
type PickerMode = "date" | "time";
type ActivePicker = { field: PickerField; mode: PickerMode } | null;

const toSafeDate = (value?: string): Date => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (value: Date): string => {
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getMinimumDate = (
  picker: ActivePicker,
  startValue: Date,
  editingEvent: CalendarEventResponse | null,
): Date | undefined => {
  if (!picker || picker.mode !== "date") {
    return undefined;
  }

  if (picker.field === "end") {
    return startValue;
  }

  return editingEvent ? undefined : new Date();
};

export default function EventFormModal({
  visible,
  editingEvent,
  formData,
  onClose,
  onFormDataChange,
  onSave,
}: EventFormModalProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleRecurrenceChange = (recurrence: RecurrenceData) => {
    // Update recurrence data
    const updatedFormData: FormData = { ...formData, recurrence };
    
    // Sync start date and time from recurrence to main event
    if (recurrence.startDate || recurrence.setTime) {
      const currentStart = new Date(formData.startDateTime || new Date());
      
      // Update date if recurrence has startDate
      if (recurrence.startDate) {
        const [year, month, day] = recurrence.startDate.split('-').map(Number);
        currentStart.setFullYear(year, month - 1, day);
      }
      
      // Update time if recurrence has setTime
      if (recurrence.setTime) {
        const [hours, minutes] = recurrence.setTime.split(':').map(Number);
        currentStart.setHours(hours, minutes, 0, 0);
      }
      
      updatedFormData.startDateTime = currentStart.toISOString();
      
      // Also update end time to maintain duration
      const currentEnd = new Date(formData.endDateTime || formData.startDateTime || new Date());
      const originalStart = new Date(formData.startDateTime || new Date());
      const duration = currentEnd.getTime() - originalStart.getTime();
      const newEnd = new Date(currentStart.getTime() + duration);
      updatedFormData.endDateTime = newEnd.toISOString();
    }
    
    onFormDataChange(updatedFormData);
  };

  const getRecurrenceText = () => {
    if (!formData.recurrence) {
      return "Does not repeat";
    }
    const { frequency, interval, byWeekDay, setTime } = formData.recurrence;
    
    let text = "";
    if (frequency === "weekly" && byWeekDay && byWeekDay.length > 0) {
      const days = byWeekDay.map(d => d.slice(0, 2)).join(", ");
      text = `Every ${interval > 1 ? interval + " " : ""}week${interval > 1 ? "s" : ""} on ${days}`;
    } else {
      const freq = frequency === "daily" ? "day" : 
                   frequency === "weekly" ? "week" : 
                   frequency === "monthly" ? "month" : "year";
      text = `Every ${interval > 1 ? interval + " " : ""}${freq}${interval > 1 ? "s" : ""}`;
    }
    
    if (setTime) {
      text += ` at ${setTime}`;
    }
    
    return text;
  };

  const startValue = toSafeDate(formData.startDateTime);
  const endValue = toSafeDate(formData.endDateTime || formData.startDateTime);

  const openPicker = (field: PickerField, mode: PickerMode) => {
    setActivePicker({ field, mode });
  };

  const getPickerValue = (field: PickerField): Date =>
    field === "start" ? startValue : endValue;

  const setPickerValue = (field: PickerField, value: Date) => {
    const targetField = field === "start" ? "startDateTime" : "endDateTime";
    handleInputChange(targetField, value.toISOString());
  };

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date,
  ) => {
    if (!activePicker) {
      return;
    }

    const { field, mode } = activePicker;
    setActivePicker(null);

    if (event.type !== "set" || !selectedValue) {
      return;
    }

    const currentValue = getPickerValue(field);
    const updated = new Date(currentValue);

    if (mode === "date") {
      updated.setFullYear(
        selectedValue.getFullYear(),
        selectedValue.getMonth(),
        selectedValue.getDate(),
      );
    } else {
      updated.setHours(
        selectedValue.getHours(),
        selectedValue.getMinutes(),
        0,
        0,
      );
    }

    setPickerValue(field, updated);
  };

  const renderPickerInput = (
    field: PickerField,
    mode: PickerMode,
    value: Date,
  ) => {
    const isDateMode = mode === "date";
    const iconName = isDateMode ? "calendar-outline" : "time-outline";
    const displayText = isDateMode ? formatDate(value) : formatTime(value);

    return (
      <TouchableOpacity
        style={[styles.input, styles.pickerInput]}
        onPress={() => openPicker(field, mode)}
      >
        <Text style={styles.pickerText}>{displayText}</Text>
        <Ionicons name={iconName} size={18} color={colors.text} />
      </TouchableOpacity>
    );
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
            <View style={styles.pickerRow}>
              {renderPickerInput("start", "date", startValue)}
              {renderPickerInput("start", "time", startValue)}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date & Time</Text>
            <View style={styles.pickerRow}>
              {renderPickerInput("end", "date", endValue)}
              {renderPickerInput("end", "time", endValue)}
            </View>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Repeat</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput]}
              onPress={() => setShowRepeatModal(true)}
            >
              <Text style={styles.pickerText}>{getRecurrenceText()}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {activePicker ? (
          <DateTimePicker
            value={activePicker.field === "start" ? startValue : endValue}
            mode={activePicker.mode}
            display="default"
            is24Hour
            minimumDate={getMinimumDate(activePicker, startValue, editingEvent)}
            onChange={handlePickerChange}
          />
        ) : null}

        <RepeatModal
          visible={showRepeatModal}
          recurrence={formData.recurrence || null}
          onClose={() => setShowRepeatModal(false)}
          onSave={handleRecurrenceChange}
          initialDateTime={formData.startDateTime}
        />
      </SafeAreaView>
    </Modal>
  );
}
