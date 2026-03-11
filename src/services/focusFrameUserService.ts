import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/api';
import { apiClient } from './apiClient';

const USER_ID_KEY = 'focusframe_user_id';

export async function findOrCreateUser(email: string): Promise<User> {
  const user = await apiClient.post<User>('/users/find-or-create', { email });
  await SecureStore.setItemAsync(USER_ID_KEY, String(user.id));
  return user;
}

export async function getStoredUserId(): Promise<number | null> {
  const stored = await SecureStore.getItemAsync(USER_ID_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export async function clearStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}
