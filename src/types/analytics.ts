export interface FocusSession {
  user_id: string;
  session_start: string;
  session_end: string;
  total_frames: number;
  focused_frames: number;
  distracted_frames: number;
  away_frames: number;
  focus_score: number;
  baseline_angle: number;
  comprehensive_analytics: ComprehensiveAnalytics;
}

export interface ComprehensiveAnalytics {
  deep_work_metrics: DeepWorkMetrics;
  distraction_analytics: DistractionAnalytics;
  biological_trends: BiologicalTrends;
  gamification_stats: GamificationStats;
  insights: string[];
}

export interface DeepWorkMetrics {
  focus_duration: {
    current_session_hours: number;
    daily_total_hours: number;
    weekly_total_hours: number;
  };
  focus_efficiency: number;
  focus_to_rest_ratio: number;
  longest_focus_streak: {
    minutes: number;
    start_time: string;
    end_time: string;
  };
  session_completion_rate: number;
}

export interface DistractionAnalytics {
  interruption_count: number;
  context_switching_cost: {
    total_minutes: number;
    interruption_count: number;
    cost_per_interruption: number;
  };
  distraction_frequency: number;
  distraction_patterns: {
    distraction_percentage: number;
    away_percentage: number;
    common_distraction_types: Record<string, number>;
    total_transitions: number;
  };
  recovery_metrics: {
    average_recovery_time_seconds: number;
    recovery_events: number;
  };
}

export interface BiologicalTrends {
  focus_heatmap: Array<{
    day_of_week: number;
    hour: number;
    focus_score: number;
    session_count: number;
  }>;
  peak_performance_times: Array<{
    hour: number;
    average_focus_score: number;
    session_count: number;
    performance_level: string;
  }>;
  rhythmic_insights: {
    best_performance_day: number;
    pattern_consistency: number;
    average_score: number;
    score_std_deviation: number;
  };
}

export interface GamificationStats {
  focus_streaks: {
    current_streak: number;
    longest_streak: number;
    total_active_days: number;
    recent_session_dates: string[];
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  peer_comparison: {
    focus_score_percentile: number;
    session_count_percentile: number;
    focus_hours_percentile: number;
    comparison_summary: string;
    total_peers: number;
  };
}
