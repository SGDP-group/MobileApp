import { isDevelopment } from "@utils/securityUtils";
import { tokenManager } from "@utils/tokenManager";

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  startDateTime?: string;
  endDateTime?: string;
  completed?: boolean;
  updated: string;
  subtasks?: TaskItem[];
  parentId?: string;
}

export interface TaskList {
  id: string;
  title: string;
}

class GoogleTasksService {
  private baseUrl = "https://tasks.googleapis.com/tasks/v1";

  /**
   * Get access token from Google Sign-In
   */
  private async getAccessToken(): Promise<string> {
    return tokenManager.getAccessToken();
  }

  /**
   * Organize tasks hierarchically by collapsing subtasks under parent tasks
   */
  private organizeTasksHierarchically(flatTasks: TaskItem[]): TaskItem[] {
    const taskMap = new Map<string, TaskItem>();
    const rootTasks: TaskItem[] = [];

    // First pass: Create task map with empty subtasks array
    flatTasks.forEach((task) => {
      const taskCopy = { ...task, subtasks: [] as TaskItem[] };
      taskMap.set(task.id, taskCopy);
    });

    // Second pass: Organize hierarchy
    flatTasks.forEach((task) => {
      if (task.parentId) {
        const parentTask = taskMap.get(task.parentId);
        const taskInMap = taskMap.get(task.id);
        if (parentTask && taskInMap) {
          if (!parentTask.subtasks) {
            parentTask.subtasks = [];
          }
          parentTask.subtasks.push(taskInMap);
        }
      } else {
        // Only add root tasks to the result
        const taskInMap = taskMap.get(task.id);
        if (taskInMap) {
          rootTasks.push(taskInMap);
        }
      }
    });

    return rootTasks;
  }

  /**
   * Make API request to Google Tasks
   */
  private async makeRequest(
    endpoint: string,
    method: string = "GET",
    body?: any,
  ): Promise<any> {
    try {
      let accessToken = await this.getAccessToken();

      let response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        tokenManager.clearCache();
        accessToken = await this.getAccessToken();

        response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API error: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (isDevelopment()) {
        console.error("Tasks API Request Error:", error);
      }
      throw error;
    }
  }

  /**
   * Get all task lists
   */
  async getTaskLists(): Promise<TaskList[]> {
    try {
      const data = await this.makeRequest("/users/@me/lists");
      return data.items || [];
    } catch (error) {
      console.error("Error getting task lists:", error);
      throw error;
    }
  }

  /**
   * Get tasks from primary task list
   */
  async getTasks(maxResults: number = 20): Promise<TaskItem[]> {
    try {
      // First get the primary task list
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        return [];
      }

      const primaryListId = lists[0].id;

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        showCompleted: "true",
        showHidden: "false",
      });

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks?${params.toString()}`,
      );

      const flatTasks = (data.items || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        startDateTime: task.updated,
        endDateTime: task.due,
        completed: task.status === "completed",
        updated: task.updated,
        parentId: task.parent,
      }));

      // Organize tasks hierarchically with subtasks collapsed under parent
      const organizedTasks = this.organizeTasksHierarchically(flatTasks);

      // Filter out completed parent tasks, but keep their subtasks visible
      return organizedTasks.filter((task) => !task.completed);
    } catch (error) {
      console.error("Error listing tasks:", error);
      throw error;
    }
  }

  /**
   * Get tasks for today
   */
  async getTodaysTasks(): Promise<TaskItem[]> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        return [];
      }

      const primaryListId = lists[0].id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const params = new URLSearchParams({
        maxResults: "20",
        showCompleted: "true",
        showHidden: "false",
      });

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks?${params.toString()}`,
      );

      const flatTasks = (data.items || [])
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          notes: task.notes,
          due: task.due,
          startDateTime: task.updated,
          endDateTime: task.due,
          completed: task.status === "completed",
          updated: task.updated,
          parentId: task.parent,
        }))
        .filter((task: TaskItem) => {
          if (!task.due) return false;
          const dueDate = new Date(task.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });

      // Organize tasks hierarchically with subtasks collapsed under parent
      const organizedTasks = this.organizeTasksHierarchically(flatTasks);

      // Filter out completed parent tasks, but keep their subtasks visible
      return organizedTasks.filter((task) => !task.completed);
    } catch (error) {
      console.error("Error getting today's tasks:", error);
      return [];
    }
  }

  /**
   * Get subtasks for a specific parent task
   */
  async getSubtasks(
    parentTaskId: string,
    maxResults: number = 50,
  ): Promise<TaskItem[]> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        return [];
      }

      const primaryListId = lists[0].id;

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        parent: parentTaskId,
        showCompleted: "true",
        showHidden: "false",
      });

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks?${params.toString()}`,
      );

      return (data.items || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        startDateTime: task.updated,
        endDateTime: task.due,
        completed: task.status === "completed",
        updated: task.updated,
        parentId: task.parent,
      }));
    } catch (error) {
      console.error("Error getting subtasks:", error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    title: string,
    notes?: string,
    due?: string,
  ): Promise<TaskItem> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        throw new Error("No task lists found");
      }

      const primaryListId = lists[0].id;

      const taskData = {
        title,
        notes,
        due,
      };

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks`,
        "POST",
        taskData,
      );

      return {
        id: data.id,
        title: data.title,
        notes: data.notes,
        due: data.due,
        startDateTime: data.updated,
        endDateTime: data.due,
        completed: data.status === "completed",
        updated: data.updated,
      };
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  /**
   * Create a subtask under a parent task
   */
  async createSubtask(
    parentTaskId: string,
    title: string,
    notes?: string,
    due?: string,
  ): Promise<TaskItem> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        throw new Error("No task lists found");
      }

      const primaryListId = lists[0].id;
      const params = new URLSearchParams({
        parent: parentTaskId,
      });

      const taskData = {
        title,
        notes,
        due,
      };

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks?${params.toString()}`,
        "POST",
        taskData,
      );

      return {
        id: data.id,
        title: data.title,
        notes: data.notes,
        due: data.due,
        startDateTime: data.updated,
        endDateTime: data.due,
        completed: data.status === "completed",
        updated: data.updated,
        parentId: data.parent,
      };
    } catch (error) {
      console.error("Error creating subtask:", error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    updates: Partial<TaskItem>,
  ): Promise<TaskItem> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        throw new Error("No task lists found");
      }

      const primaryListId = lists[0].id;

      const taskData = {
        title: updates.title,
        notes: updates.notes,
        due: updates.due,
        status: updates.completed ? "completed" : "needsAction",
      };

      const data = await this.makeRequest(
        `/lists/${primaryListId}/tasks/${taskId}`,
        "PATCH",
        taskData,
      );

      return {
        id: data.id,
        title: data.title,
        notes: data.notes,
        due: data.due,
        startDateTime: data.updated,
        endDateTime: data.due,
        completed: data.status === "completed",
        updated: data.updated,
      };
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const lists = await this.getTaskLists();
      if (lists.length === 0) {
        throw new Error("No task lists found");
      }

      const primaryListId = lists[0].id;

      await this.makeRequest(
        `/lists/${primaryListId}/tasks/${taskId}`,
        "DELETE",
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }
}

export const googleTasksService = new GoogleTasksService();
