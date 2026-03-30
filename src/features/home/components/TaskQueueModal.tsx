import { useLoading } from "@/src/shared/contexts/LoadingContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getSubtasksByTask } from "@services/focusFrameSubtaskService";
import { getSafeErrorMessage } from "@utils/securityUtils";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { HomeTask } from "../home.tasks";
import { styles } from "../styles/taskQueueModal.styles";
import { toSafeDate } from "../utils/taskQueueModal.utils";
import { SubtaskAccordionItem } from "./SubtaskAccordionItem";
import { SubtaskStatus } from "../../calendar/utils/taskQueueModalCalender.utils";

interface TaskQueueModalProps {
  visible: boolean;
  task: HomeTask | null;
  onClose: () => void;
  
}

export function TaskQueueModal({ visible, task, onClose }: TaskQueueModalProps) {


  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<NonNullable<HomeTask["subtasks"]>>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
    const [subtaskStatuses, setSubtaskStatuses] = useState<SubtaskStatus[]>([]);
  
  const { setIsLoading } = useLoading();



  const normalizeStatusName = (value?: string): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }
    // Add your normalization logic here if needed
    return value;
  };


  useEffect(() => {
    let isActive = true;

    if (!visible || !task?.id) {
      setSubtasks([]);
      setIsLoadingSubtasks(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoadingSubtasks(true);
    setSubtasks([]);

    void (async () => {
      try {
        const fetchedSubtasks = await getSubtasksByTask(task.id);
        if (!isActive) {
          return;
        }

        setSubtasks(Array.isArray(fetchedSubtasks) ? fetchedSubtasks : []);

      } catch (error) {
        console.warn(
          `Failed to load subtasks for task ${task.id}:`,
          getSafeErrorMessage(error),
        );

        if (isActive) {
          setSubtasks([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingSubtasks(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [task?.id, visible]);




  useEffect(() => {
    if (!visible || subtasks.length === 0) {
      setExpandedSubtaskIds([]);
      return;
    }

    setExpandedSubtaskIds(subtasks.map((subtask) => subtask.id));
  }, [subtasks, visible]);

  const sortedSubtasks = useMemo(() => {
    if (subtasks.length === 0) {
      return [];
    }

    return [...subtasks]
      .sort((a, b) => {
        const aOrder =
          typeof a.taskOrder === "number" ? a.taskOrder : Number.MAX_SAFE_INTEGER;
        const bOrder =
          typeof b.taskOrder === "number" ? b.taskOrder : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        const aStart = toSafeDate(a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = toSafeDate(b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
      });
  }, [subtasks]);

  

  const toggleSubtask = (subtaskId: number) => {
    setExpandedSubtaskIds((prev) => {
      if (prev.includes(subtaskId)) {
        return prev.filter((id) => id !== subtaskId);
      }

      return [...prev, subtaskId];
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.taskQueueModalOverlay}>
        <View style={styles.taskQueueModalContent}>
          <View style={styles.taskQueueModalHeader}>
            <View style={styles.taskQueueModalTitleContainer}>
              <Text
                style={styles.taskQueueModalTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {!task ? "Task Queue" : task.name}
              </Text>
            </View>
            <View style={styles.taskQueueHeaderActions}>
              <TouchableOpacity
                style={styles.taskQueueHeaderIconButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={22} color="#E5F7FF" />
              </TouchableOpacity>
            </View>
          </View>

          {!task ? (
            <View style={styles.taskQueueEmptyState}>
              <Text style={styles.taskQueueEmptyTitle}>No Task Selected</Text>
              <Text style={styles.taskQueueEmptyText}>
                Choose a task from Up Next to view queue details.
              </Text>
            </View>
          ) : (
            <ScrollView
                          style={styles.taskQueueBody}
                          contentContainerStyle={styles.taskQueueBodyContent}
                          showsVerticalScrollIndicator={false}
                        >
                          <View style={styles.taskQueueMainSection}>
                            <View style={styles.taskQueueFieldRow}>
                              <Text style={styles.taskQueueFieldLabel}>Task Name</Text>
                                <Text style={styles.taskQueueFieldValue}>{task.name}</Text>
                            </View>
            
                            <View style={styles.taskQueueFieldRow}>
                              <Text style={styles.taskQueueFieldLabel}>Description</Text>
                                <Text style={styles.taskQueueFieldValue}>{task.description}</Text>
                            </View>
                          </View>
            
                          <View style={styles.taskQueueSubtasksSection}>
                            <Text style={styles.taskQueueSectionTitle}>Subtasks</Text>
            
                            {isLoadingSubtasks ? (
                              <Text style={styles.taskQueueNoSubtasksText}>Loading subtasks...</Text>
                            ) : sortedSubtasks.length === 0 ? (
                              <Text style={styles.taskQueueNoSubtasksText}>No subtasks available.</Text>
                            ) : (
                              sortedSubtasks.map((subtask) => {
                                const isExpanded = expandedSubtaskIds.includes(subtask.id);
            
                                return (
                                  <SubtaskAccordionItem
                                    key={subtask.id}
                                    subtask={subtask}
                                    isExpanded={!isExpanded}
                                    onToggle={toggleSubtask}
                                    statusOptions={subtaskStatuses}
                                  />
                                );
                              })
                            )}
                          </View>
                        </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
