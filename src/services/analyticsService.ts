import { FocusSession } from '../types/analytics';
import { FocusTrackingService } from './focusTrackingService';

const FOCUS_TRACKING_BASE_URL = process.env.EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL;

// Type definitions for the new API responses
export interface SessionStatistics {
  total_sessions: number;
  total_duration_hours: number;
  average_focus_score: number;
  most_productive_time: string;
  average_session_duration_minutes: number;
  total_focused_hours: number;
  productivity_trend: "improving" | "declining" | "stable";
}

export interface SessionData {
  // Live session metrics
  session_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  current_state: string;
  focus_score: number;
  frames_analyzed: number;
  
  // Comprehensive analytics
  deep_work_metrics: {
    deep_work_duration_minutes: number;
    deep_work_percentage: number;
    interruptions_count: number;
  };
  
  distraction_analytics: {
    phone_pickups: number;
    face_detections_lost: number;
    distraction_events: Array<{
      timestamp: string;
      type: string;
      duration_seconds: number;
    }>;
  };
  
  biological_trends: {
    blink_rate: number;
    attention_spans: Array<{
      start_time: string;
      end_time: string;
      duration_seconds: number;
      quality_score: number;
    }>;
  };
  
  gamification_stats: {
    streak_days: number;
    total_points: number;
    achievements: string[];
    level: number;
  };
  
  personalized_insights: string[];
}

export class AnalyticsService {
  // 📊 General User Statistics
  
  /**
   * Get aggregated statistics across all user sessions
   * Endpoint: GET /api/v1/statistics?user_id={user_id}
   */
  static async getUserStatistics(userId: string): Promise<SessionStatistics> {
    try {
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://127.0.0.1:8002";
      const url = `${BASE_URL}/api/v1/statistics?user_id=${userId}`;
      console.log('Getting user statistics:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Statistics API not available (${response.status}), returning empty data`);
        return this.getEmptyStatistics();
      }

      return await response.json();
    } catch (error) {
      console.warn('User statistics error, returning empty data:', error);
      return this.getEmptyStatistics();
    }
  }

  // 🎯 Session-Specific Statistics
  
  /**
   * Get real-time data for the currently active session
   * Endpoint: GET /api/v1/focus/session/{user_id}/current
   */
  static async getCurrentSession(userId: string): Promise<SessionData> {
    try {
      // First try to get the current session data from focus tracking service
      if (FocusTrackingService.isSessionActive()) {
        const sessionData = await FocusTrackingService.getSessionData(userId);
        // Transform FocusSession to SessionData format
        return this.transformFocusSessionToSessionData(sessionData);
      }

      // Fallback to direct API call
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://127.0.0.1:8002";
      const url = `${BASE_URL}/api/v1/focus/session/${userId}/current`;
      console.log('Getting current session:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Current session API not available (${response.status}), returning empty data`);
        return this.getEmptySessionData(userId);
      }

      return await response.json();
    } catch (error) {
      console.warn('Current session error, returning empty data:', error);
      return this.getEmptySessionData(userId);
    }
  }
  
  /**
   * Get completed sessions with their detailed analytics
   * Endpoint: GET /api/v1/focus/session/{user_id}/history?limit={limit}
   */
  static async getSessionHistory(userId: string, limit: number = 10): Promise<SessionData[]> {
    try {
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://127.0.0.1:8002";
      const url = `${BASE_URL}/api/v1/focus/session/${userId}/history?limit=${limit}`;
      console.log('Getting session history:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Session history API not available (${response.status}), returning empty data`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.warn('Session history error, returning empty data:', error);
      return [];
    }
  }
  
  /**
   * Get detailed analytics for a specific completed session
   * Endpoint: GET /api/v1/focus/session/{session_id}/result
   */
  static async getSessionResult(sessionId: string): Promise<SessionData> {
    try {
      const BASE_URL = FOCUS_TRACKING_BASE_URL || "http://127.0.0.1:8002";
      const url = `${BASE_URL}/api/v1/focus/session/${sessionId}/result`;
      console.log('Getting session result:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Session result API not available (${response.status}), returning empty data`);
        return this.getEmptySessionData('unknown');
      }

      return await response.json();
    } catch (error) {
      console.warn('Session result error, returning empty data:', error);
      return this.getEmptySessionData('unknown');
    }
  }
  
  // 🔧 Legacy Methods (for backward compatibility)
  
  /**
   * @deprecated Use getCurrentSession instead
   */
  static async getFocusSession(userId: string): Promise<FocusSession> {
    console.warn('getFocusSession is deprecated. Use getCurrentSession instead.');
    try {
      const sessionData = await this.getCurrentSession(userId);
      return sessionData as unknown as FocusSession;
    } catch (error) {
      console.warn('Legacy getFocusSession failed, returning empty data:', error);
      // Return empty FocusSession data
      return {
        user_id: userId,
        session_start: new Date().toISOString(),
        session_end: new Date().toISOString(),
        total_frames: 0,
        focused_frames: 0,
        distracted_frames: 0,
        away_frames: 0,
        focus_score: 0,
        baseline_angle: 0,
        comprehensive_analytics: {
          deep_work_metrics: {
            focus_duration: {
              current_session_hours: 0,
              daily_total_hours: 0,
              weekly_total_hours: 0,
            },
            focus_efficiency: 0,
            focus_to_rest_ratio: 0,
            longest_focus_streak: {
              minutes: 0,
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
            },
            session_completion_rate: 0,
          },
          distraction_analytics: {
            interruption_count: 0,
            context_switching_cost: {
              total_minutes: 0,
              interruption_count: 0,
              cost_per_interruption: 0,
            },
            distraction_frequency: 0,
            distraction_patterns: {
              distraction_percentage: 0,
              away_percentage: 0,
              common_distraction_types: {},
              total_transitions: 0,
            },
            recovery_metrics: {
              average_recovery_time_seconds: 0,
              recovery_events: 0,
            },
          },
          biological_trends: {
            focus_heatmap: [],
            peak_performance_times: [],
            rhythmic_insights: {
              best_performance_day: 0,
              pattern_consistency: 0,
              average_score: 0,
              score_std_deviation: 0,
            },
          },
          gamification_stats: {
            focus_streaks: {
              current_streak: 0,
              longest_streak: 0,
              total_active_days: 0,
              recent_session_dates: [],
            },
            achievements: [],
            peer_comparison: {
              focus_score_percentile: 0,
              session_count_percentile: 0,
              focus_hours_percentile: 0,
              comparison_summary: 'No data available',
              total_peers: 0,
            },
          },
          insights: [
            'Start focus sessions to see personalized insights',
            'Complete sessions to track your progress',
          ],
        },
      };
    }
  }
  
  /**
   * @deprecated Use getUserStatistics and getSessionHistory instead
   */
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
    console.warn('getHistoricalAnalytics is deprecated. Use getUserStatistics and getSessionHistory instead.');
    
    try {
      // Try to get statistics and recent sessions
      const [statistics, recentSessions] = await Promise.all([
        this.getUserStatistics(userId),
        this.getSessionHistory(userId, Math.min(days * 2, 20)) // Rough estimate
      ]);
      
      // Transform data to match old format
      return this.transformToLegacyFormat(statistics, recentSessions, days);
    } catch (error) {
      console.error('Historical analytics error:', error);
      return this.generateBasicInsights();
    }
  }
  
  private static transformToLegacyFormat(statistics: SessionStatistics, sessions: SessionData[], days: number) {
    // Group sessions by date
    const dailyData = sessions.reduce((acc, session) => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          focus_score: 0,
          session_duration: 0,
          completed_sessions: 0
        };
      }
      
      const duration = session.end_time 
        ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60 // minutes
        : 0;
      
      acc[date].focus_score += session.focus_score;
      acc[date].session_duration += duration;
      acc[date].completed_sessions += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    const dailySessions = Object.values(dailyData).map((day: any) => ({
      ...day,
      focus_score: Math.round(day.focus_score / day.completed_sessions)
    }));
    
    return {
      daily_sessions: dailySessions,
      weekly_averages: {
        avg_focus_score: statistics.average_focus_score,
        avg_session_duration: statistics.average_session_duration_minutes,
        total_sessions: statistics.total_sessions,
        total_focus_hours: statistics.total_focused_hours
      },
      insights: [
        "Complete focus sessions to see your personalized insights",
        "Maintain consistent work hours for better focus patterns",
        "Take regular breaks to improve overall focus quality",
      ],
    };
  }
  
  // Helper methods for empty data responses
  
  private static getEmptyStatistics(): SessionStatistics {
    return {
      total_sessions: 0,
      total_duration_hours: 0,
      average_focus_score: 0,
      most_productive_time: 'Not enough data',
      average_session_duration_minutes: 0,
      total_focused_hours: 0,
      productivity_trend: 'stable',
    };
  }
  
  private static getEmptySessionData(userId: string): SessionData {
    return {
      session_id: `empty_${Date.now()}`,
      user_id: userId,
      start_time: new Date().toISOString(),
      end_time: undefined,
      current_state: 'inactive',
      focus_score: 0,
      frames_analyzed: 0,
      deep_work_metrics: {
        deep_work_duration_minutes: 0,
        deep_work_percentage: 0,
        interruptions_count: 0,
      },
      distraction_analytics: {
        phone_pickups: 0,
        face_detections_lost: 0,
        distraction_events: [],
      },
      biological_trends: {
        blink_rate: 0,
        attention_spans: [],
      },
      gamification_stats: {
        streak_days: 0,
        total_points: 0,
        achievements: [],
        level: 1,
      },
      personalized_insights: [
        'Start focus sessions to see personalized insights',
        'Complete sessions to track your progress',
        'Maintain consistent work habits for better analytics',
      ],
    };
  }

  private static transformFocusSessionToSessionData(focusSession: FocusSession): SessionData {
    // Transform FocusSession format to SessionData format
    return {
      session_id: `session_${Date.now()}`, // Generate a session ID
      user_id: focusSession.user_id,
      start_time: focusSession.session_start,
      end_time: focusSession.session_end,
      current_state: 'completed', // Since this is from completed session data
      focus_score: focusSession.focus_score,
      frames_analyzed: focusSession.total_frames,
      deep_work_metrics: {
        deep_work_duration_minutes: Math.round(focusSession.comprehensive_analytics.deep_work_metrics.focus_duration.current_session_hours * 60),
        deep_work_percentage: Math.round(focusSession.comprehensive_analytics.deep_work_metrics.focus_efficiency * 100),
        interruptions_count: focusSession.comprehensive_analytics.distraction_analytics.interruption_count,
      },
      distraction_analytics: {
        phone_pickups: 0, // Not available in FocusSession, would need to be tracked separately
        face_detections_lost: 0, // Not available in FocusSession, would need to be tracked separately
        distraction_events: [], // Would need to be populated from actual data
      },
      biological_trends: {
        blink_rate: 0, // Not available in FocusSession, would need to be tracked separately
        attention_spans: [], // Would need to be populated from actual data
      },
      gamification_stats: {
        streak_days: focusSession.comprehensive_analytics.gamification_stats.focus_streaks.current_streak,
        total_points: 0, // Not available in FocusSession, would need to be calculated
        achievements: focusSession.comprehensive_analytics.gamification_stats.achievements.map(a => a.name),
        level: 1, // Not available in FocusSession, would need to be calculated
      },
      personalized_insights: focusSession.comprehensive_analytics.insights,
    };
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
