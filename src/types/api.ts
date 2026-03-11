export interface User {
  id: number;
  email: string;
}

export interface Task {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: number;
  name: string;
  description?: string;
  taskId: number;
  taskOrder: number;
  startTime?: string;
  duration?: number;
  estimatedTime?: number;
  completed: boolean;
  productive?: number;
  isTracked: boolean;
  isAiBreakdown: boolean;
  statusId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskStatus {
  id: number;
  name: string;
}

export type CreateTaskPayload = Pick<Task, 'name' | 'userId'>;
export type UpdateTaskPayload = Pick<Task, 'name' | 'userId'>;

export type CreateSubtaskPayload = Pick<Subtask, 'name' | 'taskId'> &
  Partial<Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>>;

export type PatchSubtaskPayload = Partial<
  Omit<Subtask, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>
>;
