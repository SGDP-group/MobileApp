import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { styles } from "@shared/styles/RepeatModal.styles";
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

export interface RecurrenceData {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byWeekDay?: string[]; // ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
  startDate: string;
  endType: "never" | "on" | "after";
  endDate?: string;
  count?: number;
  setTime?: string;
}

interface RepeatModalProps {
  visible: boolean;
  recurrence: RecurrenceData | null;
  onClose: () => void;
  onSave: (recurrence: RecurrenceData) => void;
}

const WEEKDAYS = [
  { label: "M", value: "MO", fullName: "Monday" },
  { label: "T", value: "TU", fullName: "Tuesday" },
  { label: "W", value: "WE", fullName: "Wednesday" },
  { label: "T", value: "TH", fullName: "Thursday" },
  { label: "F", value: "FR", fullName: "Friday" },
  { label: "S", value: "SA", fullName: "Saturday" },
  { label: "S", value: "SU", fullName: "Sunday" },
];

const FREQUENCIES = [
  { label: "day", value: "daily" },
  { label: "week", value: "weekly" },
  { label: "month", value: "monthly" },
  { label: "year", value: "yearly" },
];

const formatDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = value.toLocaleDateString("en-US", { month: "long" });
  const day = value.getDate();
  return `${month} ${day}`;
};

const formatDateForStorage = (value: Date): string => {
  return value.toISOString().split("T")[0];
};

export default function RepeatModal({
  visible,
  recurrence,
  onClose,
  onSave,
}: RepeatModalProps) {
  const [frequency, setFrequency] = useState<RecurrenceData["frequency"]>(
    recurrence?.frequency || "weekly"
  );
  const [interval, setInterval] = useState(recurrence?.interval || 1);
  const [byWeekDay, setByWeekDay] = useState<string[]>(
    recurrence?.byWeekDay || []
  );
  const [startDate, setStartDate] = useState(
    recurrence?.startDate || formatDateForStorage(new Date())
  );
  const [endType, setEndType] = useState<RecurrenceData["endType"]>(
    recurrence?.endType || "never"
  );
  const [endDate, setEndDate] = useState(
    recurrence?.endDate || formatDateForStorage(new Date())
  );
  const [count, setCount] = useState(recurrence?.count || 13);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const toggleWeekDay = (day: string) => {
    if (byWeekDay.includes(day)) {
      setByWeekDay(byWeekDay.filter((d) => d !== day));
    } else {
      setByWeekDay([...byWeekDay, day]);
    }
  };

  const handleSave = () => {
    const recurrenceData: RecurrenceData = {
      frequency,
      interval,
      byWeekDay: frequency === "weekly" ? byWeekDay : undefined,
      startDate,
      endType,
      endDate: endType === "on" ? endDate : undefined,
      count: endType === "after" ? count : undefined,
    };
    onSave(recurrenceData);
    onClose();
  };

  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowStartPicker(false);
    if (event.type === "set" && selectedDate) {
      setStartDate(formatDateForStorage(selectedDate));
    }
  };

  const handleEndDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowEndPicker(false);
    if (event.type === "set" && selectedDate) {
      setEndDate(formatDateForStorage(selectedDate));
    }
  };

  const getFrequencyLabel = () => {
    return FREQUENCIES.find((f) => f.value === frequency)?.label || "week";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Repeats</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.doneButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Every Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Every</Text>
            <View style={styles.everyRow}>
              <TextInput
                style={styles.intervalInput}
                value={String(interval)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setInterval(Math.max(1, num));
                }}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.frequencySelector}
                onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
              >
                <Text style={styles.frequencyText}>{getFrequencyLabel()}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {showFrequencyPicker && (
              <View style={styles.frequencyPicker}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={styles.frequencyOption}
                    onPress={() => {
                      setFrequency(freq.value as RecurrenceData["frequency"]);
                      setShowFrequencyPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.frequencyOptionText,
                        frequency === freq.value &&
                          styles.frequencyOptionTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Weekday Selection (only for weekly) */}
          {frequency === "weekly" && (
            <View style={styles.section}>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.weekdayButton,
                      byWeekDay.includes(day.value) &&
                        styles.weekdayButtonActive,
                    ]}
                    onPress={() => toggleWeekDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        byWeekDay.includes(day.value) && styles.weekdayTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Set Time Button */}
          <TouchableOpacity style={styles.setTimeButton}>
            <Text style={styles.setTimeText}>Set time</Text>
          </TouchableOpacity>

          {/* Starts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Starts</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>
                {formatDate(new Date(startDate))}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ends Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ends</Text>

            {/* Never Option */}
            <TouchableOpacity
              style={styles.endOption}
              onPress={() => setEndType("never")}
            >
              <View
                style={[
                  styles.radio,
                  endType === "never" && styles.radioActive,
                ]}
              >
                {endType === "never" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.endOptionText}>Never</Text>
            </TouchableOpacity>

            {/* On Date Option */}
            <TouchableOpacity
              style={styles.endOption}
              onPress={() => setEndType("on")}
            >
              <View
                style={[styles.radio, endType === "on" && styles.radioActive]}
              >
                {endType === "on" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.endOptionText}>On</Text>
              <TouchableOpacity
                style={styles.endDateInput}
                onPress={() => {
                  setEndType("on");
                  setShowEndPicker(true);
                }}
                disabled={endType !== "on"}
              >
                <Text
                  style={[
                    styles.endDateText,
                    endType !== "on" && styles.endDateTextDisabled,
                  ]}
                >
                  {formatDate(new Date(endDate))}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* After Count Option */}
            <TouchableOpacity
              style={styles.endOption}
              onPress={() => setEndType("after")}
            >
              <View
                style={[
                  styles.radio,
                  endType === "after" && styles.radioActive,
                ]}
              >
                {endType === "after" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.endOptionText}>After</Text>
              <TextInput
                style={[
                  styles.countInput,
                  endType !== "after" && styles.countInputDisabled,
                ]}
                value={String(count)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setCount(Math.max(1, num));
                }}
                keyboardType="number-pad"
                editable={endType === "after"}
                onFocus={() => setEndType("after")}
              />
              <Text style={styles.endOptionText}>occurrences</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={new Date(startDate)}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={new Date(endDate)}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={new Date(startDate)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
