/**
 * Task completion handlers with subtask logic
 */

import { TaskItem, googleTasksService } from "@services/googleTasksService";
import { Alert } from "react-native";

export const handleToggleSubtaskComplete = async (
  subtask: TaskItem,
  parentTask: TaskItem & { isTask: true },
  onSubtaskUpdate: (callback: () => void) => void,
  onAllSubtasksComplete: (parentTask: TaskItem & { isTask: true }) => void,
) => {
  const action = subtask.completed ? "mark as incomplete" : "mark as complete";

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
            Alert.alert(
              "All Subtasks Completed",
              "All subtasks are completed. Do you want to mark the main task as complete?",
              [
                {
                  text: "Not Yet",
                  onPress: () => {
                    onSubtaskUpdate(() => {});
                  },
                },
                {
                  text: "Complete",
                  onPress: () => {
                    onAllSubtasksComplete(parentTask);
                  },
                },
              ],
            );
          } else {
            onSubtaskUpdate(() => {});
          }
        } catch (error) {
          console.error("Error toggling subtask:", error);
          Alert.alert("Error", "Failed to update subtask");
        }
      },
    },
  ]);
};

export const handleToggleTaskComplete = async (
  task: TaskItem & { isTask: true },
  skipConfirmation: boolean = false,
  onTaskUpdate: (callback: () => void) => void,
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
                onTaskUpdate(() => {});
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

                onTaskUpdate(() => {});
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
              onTaskUpdate(() => {});
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
      onTaskUpdate(() => {});
    } catch (error) {
      console.error("Error toggling task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  }
};
