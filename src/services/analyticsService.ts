import { FocusSession } from '../types/analytics';

export class AnalyticsService {
  static async getFocusSession(userId: string): Promise<FocusSession> {
    // Using local endpoint as specified
    const BASE_URL = "http://10.238.215.83:8002"; // Use host IP for Android emulator
    const url = `${BASE_URL}/api/v1/focus/session/${userId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Analytics API Error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<FocusSession>;
    } catch (error) {
      throw new Error('Could not connect to analytics service');
    }
  }
}
