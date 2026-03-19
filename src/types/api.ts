export interface User {
  id: number;
  email: string;
}

export interface SubtaskStatus {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  name: string;
  user?: User;
  userId?: number;
  subTasks?: Subtask[];
  description?: string;
  deadline?: string;
  duration?: number;
  focusTime?: number;
  breakTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: number;
  name: string;
  description?: string;
  task?: string;
  taskId?: number;
  taskOrder: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  estimatedTime?: number;
  completed: boolean;
  productive?: number;
  isTracked: boolean;
  isAiBreakdown: boolean;
  status?: SubtaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskPayload = Pick<Task, "name"> &
  Partial<
    Pick<
      Task,
      | "description"
      | "deadline"
      | "duration"
      | "focusTime"
      | "breakTime"
      | "user"
      | "userId"
    >
  >;

export type UpdateTaskPayload = Partial<
  Pick<
    Task,
    | "name"
    | "description"
    | "deadline"
    | "duration"
    | "focusTime"
    | "breakTime"
    | "user"
    | "userId"
  >
>;

export type CreateSubtaskPayload = Pick<Subtask, "name"> & {
  task: { id: number };
} & Partial<
    Omit<Subtask, "id" | "name" | "taskId" | "createdAt" | "updatedAt">
  >;

export type PatchSubtaskPayload = Partial<
  Omit<Subtask, "id" | "taskId" | "createdAt" | "updatedAt">
>;
