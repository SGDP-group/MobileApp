import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/type';
import { apiClient } from './apiClient';
import { apiClientAnalytics } from './apiClientAnalytics';

const USER_ID_KEY = 'focusframe_user_id';

export async function findOrCreateUser(email: string): Promise<User> {
  const user = await apiClient.post<User>('/users/find-or-create', { email });
  await SecureStore.setItemAsync(USER_ID_KEY, String(user.id));
  return user;
}


export async function getUserByEmail(email: string): Promise<User> {
      const user = await apiClient.get<User>(`/users/email/${email}`);
      return user;
}

export async function getStoredUserId(): Promise<number | null> {
  const stored = await SecureStore.getItemAsync(USER_ID_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export async function clearStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}


export async function createAnalyticsUser(userId:String): Promise<User > {
  const user = await apiClientAnalytics.post<User>('/api/v1/users', { user_id: userId });
  // get or Create user in analytics service
  //whats mean by analtics/me
  return user;
}