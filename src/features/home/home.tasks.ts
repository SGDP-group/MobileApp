import type { Subtask, Task } from "@/src/types/type";
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

const MAX_HOME_TASKS = 100;

const sortByUpdatedAtDesc = (a: { updatedAt: string }, b: { updatedAt: string }) => {
  const aUpdatedAt = new Date(a.updatedAt).getTime();
  const bUpdatedAt = new Date(b.updatedAt).getTime();
  return bUpdatedAt - aUpdatedAt;
};

const getStartTimeRank = (startTime?: string): number => {
  if (!startTime) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(startTime).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const getTaskPriorityRank = (task: Task): number => {
  const incompleteSubtasks = (task.subTasks ?? []).filter((subtask) => !subtask.completed);

  if (incompleteSubtasks.length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return incompleteSubtasks.reduce((minRank, subtask) => {
    if (typeof subtask.taskOrder !== "number") {
      return minRank;
    }

    return Math.min(minRank, subtask.taskOrder);
  }, Number.MAX_SAFE_INTEGER);
};

const getTaskEarliestStartRank = (task: Task): number => {
  const incompleteSubtasks = (task.subTasks ?? []).filter((subtask) => !subtask.completed);

  if (incompleteSubtasks.length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return incompleteSubtasks.reduce((earliest, subtask) => {
    return Math.min(earliest, getStartTimeRank(subtask.startTime));
  }, Number.MAX_SAFE_INTEGER);
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

      const hasEmbeddedSubtasks = tasksArray.some((task) => Array.isArray(task.subTasks));

      const sortedTopTasks = hasEmbeddedSubtasks
        ? [...tasksArray]
            .filter((task) => (task.subTasks ?? []).some((subtask) => !subtask.completed))
            .sort((a, b) => {
              const priorityDelta = getTaskPriorityRank(a) - getTaskPriorityRank(b);
              if (priorityDelta !== 0) {
                return priorityDelta;
              }

              const startTimeDelta = getTaskEarliestStartRank(a) - getTaskEarliestStartRank(b);
              if (startTimeDelta !== 0) {
                return startTimeDelta;
              }

              return sortByUpdatedAtDesc(a, b);
            })
            .slice(0, MAX_HOME_TASKS)
        : [...tasksArray]
            .sort(sortByUpdatedAtDesc)
            .slice(0, MAX_HOME_TASKS);

      if (isMountedRef.current) {
        setTasks(sortedTopTasks);
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
    return tasks.slice(0, MAX_HOME_TASKS);
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
