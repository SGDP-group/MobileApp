import { colors } from "@/src/shared/theme/colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CalendarEventResponse } from "@services/googleCalendarService";
import { styles } from "@shared/styles/EventDetailModal.styles";
import React from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EventDescription from "./EventDescription";

interface EventDetailModalProps {
  visible: boolean;
  event: CalendarEventResponse | null;
  onClose: () => void;
  onEdit: (event: CalendarEventResponse) => void;
  onDelete: (eventId: string) => void;
  formatDateTime: (dateString: string | undefined) => string;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onEdit,
  onDelete,
  formatDateTime,
}: EventDetailModalProps) {
  const meetingLink = React.useMemo(() => {
    if (!event) return null;

    const links: string[] = [];

    if (event.hangoutLink) {
      links.push(event.hangoutLink);
    }

    const entryPoints = event.conferenceData?.entryPoints || [];
    const videoEntry = entryPoints.find(
      (entry) => entry.entryPointType === "video" && entry.uri,
    );
    const anyEntry = entryPoints.find((entry) => entry.uri);

    if (videoEntry?.uri) {
      links.push(videoEntry.uri);
    } else if (anyEntry?.uri) {
      links.push(anyEntry.uri);
    }

    const textSources = [event.location, event.description]
      .filter(Boolean)
      .join(" ");
    const urlMatches = textSources.match(/https?:\/\/[^\s<]+/g);
    if (urlMatches?.length) {
      links.push(...urlMatches);
    }

    const unique = [...new Set(links)].filter(Boolean);
    return unique.length ? unique[0] : null;
  }, [event]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalContent}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Event Details</Text>
            <View style={styles.detailModalActions}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  event && onEdit(event);
                }}
              >
                <Ionicons name="pencil" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (event) {
                    onClose();
                    onDelete(event.id);
                  }
                }}
              >
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.detailModalBody}>
            {event && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailTitle}>{event.summary}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailText}>
                    {formatDateTime(event.start?.dateTime)}
                  </Text>
                </View>

                {event.location && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailText}>{event.location}</Text>
                  </View>
                )}

                {meetingLink && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Meeting Link</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(meetingLink)}
                    >
                      <Text style={styles.detailLink}>{meetingLink}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {event.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <EventDescription
                      html={event.description}
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
  );
}
