import Ionicons from "@expo/vector-icons/Ionicons";
import { TaskItem } from "@services/googleTasksService";
import { colors } from "@shared/theme/colors";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/calendar.styles";

interface TaskDetailModalProps {
  visible: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  formatDate: (dateString: string | undefined) => string;
}

export default function TaskDetailModal({
  visible,
  task,
  onClose,
  onEdit,
  onDelete,
  formatDate,
}: TaskDetailModalProps) {
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
            <Text style={styles.detailModalTitle}>Task Details</Text>
            <View style={styles.detailModalActions}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  task && onEdit(task);
                }}
              >
                <Ionicons name="pencil" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (task) {
                    onClose();
                    onDelete(task.id);
                  }
                }}
              >
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.detailModalBody}>
            {task && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailTitle}>{task.title}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailText}>
                    {task.completed ? "Completed" : "Pending"}
                  </Text>
                </View>

                {task.due && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailText}>
                      {formatDate(task.due)}
                    </Text>
                  </View>
                )}

                {task.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailText}>{task.notes}</Text>
                  </View>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Subtasks</Text>
                    <View style={{ marginTop: 8 }}>
                      {task.subtasks.map((subtask) => (
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
                              <Text style={styles.subtaskNotes}>
                                {subtask.notes}
                              </Text>
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
                                  {formatDate(
                                    subtask.endDateTime || subtask.due
                                  )}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.checkboxContainerRight}>
                            <Ionicons
                              name={
                                subtask.completed
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={20}
                              color={subtask.completed ? "#34C759" : "#C7C7CC"}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
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
