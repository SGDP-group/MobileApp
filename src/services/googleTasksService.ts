import { isDevelopment } from "@utils/securityUtils";
import { tokenManager } from "@utils/tokenManager";

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  completed?: boolean;
  updated: string;
}

export interface TaskList {
  id: string;
  title: string;
}

class GoogleTasksService {
  private baseUrl = "https://www.googleapis.com/tasks/v1";

  /**
   * Get access token from Google Sign-In
   */
  private async getAccessToken(): Promise<string> {
    return tokenManager.getAccessToken();
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
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

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
        showCompleted: "false",
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
        completed: task.status === "completed",
        updated: task.updated,
      }));
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
      const tasks = await this.getTasks(20);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return tasks.filter((task) => {
        if (!task.due) return false;
        const dueDate = new Date(task.due);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });
    } catch (error) {
      console.error("Error getting today's tasks:", error);
      return [];
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
        completed: data.status === "completed",
        updated: data.updated,
      };
    } catch (error) {
      console.error("Error creating task:", error);
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
