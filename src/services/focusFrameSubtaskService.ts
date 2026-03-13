import type { CreateSubtaskPayload, PatchSubtaskPayload, Subtask } from '../types/api';
import { apiClient } from './apiClient';

export async function getSubtasksByTask(taskId: number): Promise<Subtask[]> {
  return apiClient.get<Subtask[]>(`/subtasks/task/${taskId}`);
}

export async function getTodayCompletedSubtasks(): Promise<Subtask[]> {
  return apiClient.get<Subtask[]>(`/subtasks/today`);
}

export async function getSubtaskById(id: number): Promise<Subtask> {
  return apiClient.get<Subtask>(`/subtasks/${id}`);
}

export async function createSubtask(payload: CreateSubtaskPayload): Promise<Subtask> {
  return apiClient.post<Subtask>('/subtasks', payload);
}

export async function updateSubtask(id: number, payload: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subtask> {
  return apiClient.put<Subtask>(`/subtasks/${id}`, payload);
}

export async function patchSubtask(id: number, payload: PatchSubtaskPayload): Promise<Subtask> {
  return apiClient.patch<Subtask>(`/subtasks/${id}`, payload);
}

export async function deleteSubtask(id: number): Promise<void> {
  return apiClient.delete(`/subtasks/${id}`);
}
