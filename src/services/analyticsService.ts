import { FocusSession } from '../types/analytics';
import { FocusTrackingService } from './focusTrackingService';

const FOCUS_TRACKING_BASE_URL = process.env.EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL;

export class AnalyticsService {
  static async getFocusSession(userId: string): Promise<FocusSession> {
    try {
      // First try to get the current session data from focus tracking service
      if (FocusTrackingService.isSessionActive()) {
        const sessionData = await FocusTrackingService.getSessionData(userId);
        return sessionData;
      }

      // Fallback to direct API call
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://10.238.215.83:8002";
      const url = `${BASE_URL}/api/v1/focus/session/${userId}`;
      
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

  static async getHistoricalAnalytics(userId: string, days: number = 7): Promise<{
    daily_sessions: Array<{
      date: string;
      focus_score: number;
      session_duration: number;
      completed_sessions: number;
    }>;
    weekly_averages: {
      avg_focus_score: number;
      avg_session_duration: number;
      total_sessions: number;
      total_focus_hours: number;
    };
    insights: string[];
  }> {
    try {
      // This would be a new endpoint for historical data
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://10.238.215.83:8002";
      const url = `${BASE_URL}/api/v1/focus/analytics/history?user_id=${userId}&days=${days}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If historical endpoint doesn't exist, return basic insights
        return this.generateBasicInsights();
      }

      return await response.json();
    } catch (error) {
      return this.generateBasicInsights();
    }
  }

  private static generateBasicInsights() {
    return {
      daily_sessions: [],
      weekly_averages: {
        avg_focus_score: 0,
        avg_session_duration: 0,
        total_sessions: 0,
        total_focus_hours: 0,
      },
      insights: [
        "Complete focus sessions to see your personalized insights",
        "Maintain consistent work hours for better focus patterns",
        "Take regular breaks to improve overall focus quality",
      ],
    };
  }
}
