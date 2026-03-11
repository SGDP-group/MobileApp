import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/api';
import { apiClient } from './apiClient';

export async function getTasksByUser(userId: number): Promise<Task[]> {
  return apiClient.get<Task[]>(`/tasks/user/${userId}`);
}

export async function getTaskById(id: number): Promise<Task> {
  return apiClient.get<Task>(`/tasks/${id}`);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiClient.post<Task>('/tasks', payload);
}

export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
  return apiClient.put<Task>(`/tasks/${id}`, payload);
}

export async function deleteTask(id: number): Promise<void> {
  return apiClient.delete(`/tasks/${id}`);
}
