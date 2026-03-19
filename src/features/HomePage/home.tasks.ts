import type { Subtask, Task } from "@/src/types/api";
import { getSubtasksByTask } from "@services/focusFrameSubtaskService";
import { getIncompleteTasksUpToToday } from "@services/focusFrameTaskService";
import { getStoredUserId } from "@services/focusFrameUserService";
import { getSafeErrorMessage } from "@utils/securityUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type HomeTask = Task & {
  subtasks?: Subtask[];
};

export type HomeUpNextItem =
  | { id: string; type: "loading" }
  | { id: string; type: "empty" }
  | { id: string; type: "task"; task: HomeTask };

const MAX_HOME_TASKS = 6;

const sortByUpdatedAtDesc = (a: { updatedAt: string }, b: { updatedAt: string }) => {
  const aUpdatedAt = new Date(a.updatedAt).getTime();
  const bUpdatedAt = new Date(b.updatedAt).getTime();
  return bUpdatedAt - aUpdatedAt;
};

interface UseHomeTasksResult {
  upNextData: HomeUpNextItem[];
  refreshTasks: () => Promise<void>;
}

export function useHomeTasks(): UseHomeTasksResult {
  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadTasks = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      const userId = await getStoredUserId();

      if (!userId) {
        if (isMountedRef.current) {
          setTasks([]);
        }
        return;
      }

      const fetchedTasks = await getIncompleteTasksUpToToday(userId);

      const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];
      const sortedTopTasks = [...tasksArray]
        .sort(sortByUpdatedAtDesc)
        .slice(0, MAX_HOME_TASKS);

      const enrichedTasks = await Promise.all(
        sortedTopTasks.map(async (task) => {
          try {
            const subtasks = await getSubtasksByTask(task.id);
            return {
              ...task,
              subtasks: Array.isArray(subtasks) ? subtasks : [],
            };
          } catch (error) {
            console.warn(
              `Failed to load subtasks for task ${task.id}:`,
              getSafeErrorMessage(error),
            );
            return {
              ...task,
              subtasks: [],
            };
          }
        }),
      );

      if (isMountedRef.current) {
        setTasks(enrichedTasks);
      }
    } catch (error) {
      console.warn("Failed to load Home tasks:", getSafeErrorMessage(error));
      if (isMountedRef.current) {
        setTasks([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void (async () => {
      await loadTasks();
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .sort(sortByUpdatedAtDesc)
      .slice(0, MAX_HOME_TASKS);
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

  return { upNextData, refreshTasks: loadTasks };
}
