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
  tasks: any;
  success: boolean;
  subtasks: GeneratedSubtask[];
  total_estimated_time: number;
  message?: string;
  error?: string;
}

class AIBreakdownService {
  private baseUrl = process.env.EXPO_PUBLIC_AGENT_BASE_URL;

  async breakdownTask(
    request: AIBreakdownRequest,
  ): Promise<AIBreakdownResponse> {
    try {
      if (isDevelopment()) {
        console.log("AI Breakdown Request:", request);
      }

      const response = await fetch(`${this.baseUrl}/invoke-task-breakdown`, {
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
}

export const aiBreakdownService = new AIBreakdownService();
