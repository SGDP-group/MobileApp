import { isDevelopment } from "@utils/securityUtils";

export interface AIBreakdownRequest {
  title: string;
  description: string;
  duration: number;
  maximum_time_per_task: number;
  user_id: string;
  session_id?: string;
}

export interface GeneratedSubtask {
  name: string;
  description: string;
  estimated_minutes: number;
  order: number;
}

export interface AIBreakdownResponse {
  success: boolean;
  subtasks: GeneratedSubtask[];
  total_estimated_time: number;
  message?: string;
  error?: string;
}

class AIBreakdownService {
  private baseUrl =
    process.env.EXPO_PUBLIC_AGENT_BASE_URL || "http://localhost:8003";

  /**
   * Break down a task into subtasks using AI
   */
  async breakdownTask(
    request: AIBreakdownRequest,
  ): Promise<AIBreakdownResponse> {
    try {
      if (isDevelopment()) {
        console.log("AI Breakdown Request:", request);
      }

      const response = await fetch(`${this.baseUrl}/breakdown`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API error: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as AIBreakdownResponse;

      if (isDevelopment()) {
        console.log("AI Breakdown Response:", data);
      }

      return data;
    } catch (error) {
      if (isDevelopment()) {
        console.error("AI Breakdown Error:", error);
      }
      throw error;
    }
  }

  async getExampleBreakdown(taskType: string): Promise<GeneratedSubtask[]> {
    try {
      const response = await fetch(`${this.baseUrl}/example/${taskType}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch example: ${response.statusText}`);
      }

      const data = await response.json();
      return data.subtasks || [];
    } catch (error) {
      if (isDevelopment()) {
        console.error("Example Breakdown Error:", error);
      }
      throw error;
    }
  }

  /**
   * Validate if the breakdown request is valid
   */
  validateRequest(request: AIBreakdownRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (!request.description || request.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (request.duration <= 0) {
      errors.push("Duration must be greater than 0");
    }

    if (request.maximum_time_per_task <= 0) {
      errors.push("Maximum time per task must be greater than 0");
    }

    if (request.maximum_time_per_task > request.duration) {
      errors.push("Maximum time per task cannot exceed total duration");
    }

    if (!request.user_id) {
      errors.push("User ID is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert generated subtasks to a format suitable for task creation
   */
  formatSubtasksForCreation(
    subtasks: GeneratedSubtask[],
  ): Array<{ name: string; description: string; estimatedMinutes: number }> {
    return subtasks
      .sort((a, b) => a.order - b.order)
      .map(({ name, description, estimated_minutes }) => ({
        name,
        description,
        estimatedMinutes: estimated_minutes,
      }));
  }
}

export const aiBreakdownService = new AIBreakdownService();
