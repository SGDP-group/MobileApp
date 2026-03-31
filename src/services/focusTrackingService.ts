import { FocusSession } from '../types/analytics';

const FOCUS_TRACKING_BASE_URL = process.env.EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL;

if (!FOCUS_TRACKING_BASE_URL) {
  console.warn(
    '[focusTrackingService] EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL is not set. ' +
    'Focus tracking API calls will fail. Check your .env file.',
  );
}

export interface SessionStartRequest {
  user_id: string;
  session_name?: string;
  settings?: {
    focus_threshold?: number;
    distraction_threshold?: number;
  };
}

export interface SessionStartResponse {
  user_id: string;
  session_id: string;
  session_start: string;
  status: string;
  message: string;
}

export interface FrameAnalysisRequest {
  user_id: string;
  frame_data: string; // base64 encoded image from external device
  image_width: number;
  image_height: number;
  timestamp?: string;
}

export interface FrameAnalysisResponse {
  user_id: string;
  current_state: 'FOCUSED' | 'DISTRACTED' | 'AWAY';
  focus_score: number;
  baseline_angle: number;
  face_metrics: {
    centroid: { x: number; y: number };
    angle: number;
    magnitude: number;
    eye_gap: number;
    confidence: number;
    timestamp: string;
  };
  session_stats: {
    total_frames: number;
    focused_frames: number;
    distracted_frames: number;
    away_frames: number;
    session_duration: number;
    ground_frame_calibrated: boolean;
    gaze_consistency_score?: number;
    gaze_deviation?: number;
    is_consistent?: boolean;
  };
  timestamp: string;
}

export interface CalibrationRequest {
  user_id: string;
  frame_data: string; // base64 encoded frame from external device
  image_width: number;
  image_height: number;
}

export interface CalibrationResponse {
  user_id: string;
  calibrated: boolean;
  baseline_angle: number;
  message: string;
  timestamp: string;
}

export interface ActiveUsersResponse {
  active_users: string[];
  total_count: number;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  active_sessions: number;
  service_version: string;
  timestamp: string;
}

type FocusStateIconName = 'checkmark-circle' | 'warning' | 'person-off' | 'help-circle';

export class FocusTrackingService {
  private static BASE_URL = FOCUS_TRACKING_BASE_URL || "http://10.238.215.83:8002";
  private static currentUserId: string | null = null;
  private static currentSessionId: string | null = null;


  // User Management
  static setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  static getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  static setCurrentSession(sessionId: string | null) {
    this.currentSessionId = sessionId;
  }

  static getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Session Management
  static async startSession(request: SessionStartRequest): Promise<SessionStartResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.setCurrentUser(result.user_id);
      this.setCurrentSession(result.session_id);
      return result;
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  static async endSession(userId?: string): Promise<FocusSession> {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) {
      throw new Error('No user session active');
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/api/v1/focus/session/end?user_id=${targetUserId}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.setCurrentSession(null);
      return result;
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  static async getSessionData(userId?: string): Promise<FocusSession> {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) {
      throw new Error('No user session active');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/session/${targetUserId}`);

      if (!response.ok) {
        throw new Error(`Failed to get session data: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  // Frame Analysis
  static async analyzeFrame(request: FrameAnalysisRequest): Promise<FrameAnalysisResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze frame: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  // Calibration
  static async calibrateGroundFrame(request: CalibrationRequest): Promise<CalibrationResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/ground-frame/calibrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to calibrate: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  // System Information
  static async getActiveUsers(): Promise<ActiveUsersResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/users/active`);

      if (!response.ok) {
        throw new Error(`Failed to get active users: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  static async getHealthStatus(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/v1/focus/health`);

      if (!response.ok) {
        throw new Error(`Failed to get health status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Could not connect to focus tracking service');
    }
  }

  // Utility Methods
  static isSessionActive(): boolean {
    return this.currentUserId !== null && this.currentSessionId !== null;
  }

  static clearSession() {
    this.currentUserId = null;
    this.currentSessionId = null;
  }

  // Get focus state color
  static getFocusStateColor(state: string): string {
    switch (state) {
      case 'FOCUSED':
        return '#4DE3B1';
      case 'DISTRACTED':
        return '#FF9F40';
      case 'AWAY':
        return '#FF6B6B';
      default:
        return '#8FA3AD';
    }
  }

  // Get focus state icon
  static getFocusStateIcon(state: string): FocusStateIconName {
    switch (state) {
      case 'FOCUSED':
        return 'checkmark-circle';
      case 'DISTRACTED':
        return 'warning';
      case 'AWAY':
        return 'person-off';
      default:
        return 'help-circle';
    }
  }
}
