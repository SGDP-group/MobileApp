import type { Subtask, Task } from "@/src/types/api";
import { getSubtasksByTask } from "@services/focusFrameSubtaskService";
import { getAllActiveTaskUpToToday } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { getSafeErrorMessage } from "@utils/securityUtils";
import { useEffect, useMemo, useState } from "react";

export type HomeTask = Task & {
  subtasks?: Subtask[];
};

export type HomeUpNextItem =
  | { id: string; type: "loading" }
  | { id: string; type: "empty" }
  | { id: string; type: "task"; task: HomeTask };

interface UseHomeTasksResult {
  upNextData: HomeUpNextItem[];
}

export function useHomeTasks(): UseHomeTasksResult {
  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const userId = await getStoredUserId();

        if (!userId) {
          if (isMounted) {
            setTasks([]);
            setIsLoading(false);
          }
          return;
        }

        const fetchedTasks = await getAllActiveTaskUpToToday(userId);

        console.log("Fetched tasks for Home screen:", fetchedTasks);

        // Prepare tasks array and limit to the top 6 by updatedAt before fetching subtasks
        const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];
        const sortedTopTasks = [...tasksArray]
          .sort((a, b) => {
            const aUpdatedAt = new Date(a.updatedAt).getTime();
            const bUpdatedAt = new Date(b.updatedAt).getTime();
            return bUpdatedAt - aUpdatedAt;
          })
          .slice(0, 6);

        const enrichedTasks = await Promise.all(
          sortedTopTasks.map(async (task) => {
            try {
              const subtasks = await getSubtasksByTask(task.id);
              return {
                ...task,
                subtasks: Array.isArray(subtasks) ? subtasks : [],
              };
            } catch {
              return {
                ...task,
                subtasks: [],
              };
            }
          }),
        );

        if (isMounted) {
          setTasks(enrichedTasks);
        }
      } catch (error) {
        console.warn("Failed to load Home tasks:", getSafeErrorMessage(error));
        if (isMounted) {
          setTasks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const aUpdatedAt = new Date(a.updatedAt).getTime();
        const bUpdatedAt = new Date(b.updatedAt).getTime();
        return bUpdatedAt - aUpdatedAt;
      })
      .slice(0, 6);
  }, [tasks]);

  const upNextData = useMemo<HomeUpNextItem[]>(() => {
    if (isLoading) {
      return [{ id: "loading", type: "loading" }];
    }

    if (filteredTasks.length === 0) {
      return [{ id: "empty", type: "empty" }];
    }

    return filteredTasks.map((task) => ({
      id: String(task.id),
      type: "task",
      task,
    }));
  }, [filteredTasks, isLoading]);

  return { upNextData };
}
