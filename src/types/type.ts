export interface User {
  id: number;
  email: string;
}

export interface SubtaskStatus {
  StatusId: number;
  StatusName: string;
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
  taskOrder: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  estimatedTime?: number;
  completed: boolean;
  isTracked: boolean;
  isAiBreakdown: boolean;
  statusName: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  googleEventId?: string;
}


export interface  CalendarTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  completed: boolean;
  subtasks: {
    id: string;
    title: string;
    notes?: string;
    due?: string;
    completed: boolean;
  }[];
};


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


