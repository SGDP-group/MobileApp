export type SubtaskDraft = {
  name: string;
  description: string;
  startTime: Date | null;
  endTime: Date | null;
};

export type SubtaskPickerState = {
  index: number;
  field: "startTime" | "endTime";
  mode: "date" | "time";
};


export interface Subtask {
  description: string;
  status: "pending" | "completed";
  estimated_time: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  date?: string; // YYYY-MM-DD
  conflictDetected?: boolean;
  conflictWith?: {
    type?: string;
    id?: number;
    taskId?: number;
    taskName?: string;
    subtaskDescription?: string;
    endTime?: string;
    resolution?: string;
  } | null;
  subtasks: Subtask[];
}

export interface Task {
  description: string;
  status: "pending" | "completed";
  estimated_time: number;
  subtasks: Subtask[];
}

export interface AIBreakdownResult {
  success: boolean;
  message: string;
  tasks: Task[];
  user_id: string;
}
