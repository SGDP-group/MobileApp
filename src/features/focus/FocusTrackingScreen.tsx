import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    FocusTrackingService,
    HealthResponse,
    SessionStartResponse
} from "../../services/focusTrackingService";
import { styles } from "./styles/focusTracking.styles";

const { width, height } = Dimensions.get("window");

export default function FocusTrackingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionStartResponse | null>(null);
  const [currentFocusState, setCurrentFocusState] = useState<'FOCUSED' | 'DISTRACTED' | 'AWAY'>('FOCUSED');
  const [focusScore, setFocusScore] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalFrames: 0,
    focusedFrames: 0,
    distractedFrames: 0,
    awayFrames: 0,
    sessionDuration: 0,
  });
  const [serviceHealth, setServiceHealth] = useState<HealthResponse | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  
  const sessionDurationRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Check service health on mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  // Poll for session data when session is active
  useEffect(() => {
    if (sessionActive && currentSession) {
      pollingIntervalRef.current = setInterval(() => {
        pollSessionData();
      }, 2000); // Poll every 2 seconds
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionActive, currentSession]);

  // Pulse animation for focus state
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const interval = setInterval(pulse, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkServiceHealth = async () => {
    try {
      const health = await FocusTrackingService.getHealthStatus();
      setServiceHealth(health);
    } catch (error) {
      console.error('Service health check failed:', error);
    }
  };

  const pollSessionData = async () => {
    if (!currentSession) return;
    
    try {
      const sessionData = await FocusTrackingService.getSessionData(currentSession.user_id);
      setCurrentFocusState(sessionData.comprehensive_analytics.focus_distribution.current_state);
      setFocusScore(sessionData.focus_score);
      setSessionStats({
        totalFrames: sessionData.total_frames,
        focusedFrames: sessionData.focused_frames,
        distractedFrames: sessionData.distracted_frames,
        awayFrames: sessionData.away_frames,
        sessionDuration: sessionData.comprehensive_analytics.session_duration,
      });
    } catch (error) {
      console.error('Failed to poll session data:', error);
    }
  };

  const startSession = async () => {
    try {
      setIsStartingSession(true);
      
      // Generate a user ID based on email or use a default
      const userId = "user_" + Date.now(); // In real app, get from auth context
      
      const session = await FocusTrackingService.startSession({
        user_id: userId,
        session_name: "Mobile Focus Session",
        settings: {
          focus_threshold: 20,
          distraction_threshold: 30,
        },
      });

      setCurrentSession(session);
      setSessionActive(true);
      
      // Start polling for session data
      pollSessionData();
      
      Alert.alert("Session Started", "Focus tracking is now active. Frames will be analyzed from your external device.");
    } catch (error) {
      console.error("Failed to start session:", error);
      Alert.alert("Error", "Could not start focus tracking session");
    } finally {
      setIsStartingSession(false);
    }
  };

  const endSession = async () => {
    try {
      setIsEndingSession(true);
      
      const sessionData = await FocusTrackingService.endSession();
      
      setSessionActive(false);
      setCurrentSession(null);
      
      // Navigate to analytics with session data
      navigation.navigate("Analytics");
      
      Alert.alert(
        "Session Complete", 
        `Focus Score: ${sessionData.focus_score.toFixed(1)}%\nDuration: ${formatDuration(sessionStats.sessionDuration)}`
      );
    } catch (error) {
      console.error("Failed to end session:", error);
      Alert.alert("Error", "Could not end focus tracking session");
    } finally {
      setIsEndingSession(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFocusPercentage = (): number => {
    if (sessionStats.totalFrames === 0) return 0;
    return (sessionStats.focusedFrames / sessionStats.totalFrames) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Service Status */}
        <View style={styles.statusContainer}>
          <Ionicons 
            name={serviceHealth?.status === 'healthy' ? 'checkmark-circle' : 'alert-circle'} 
            size={24} 
            color={serviceHealth?.status === 'healthy' ? '#4DE3B1' : '#FF9F40'} 
          />
          <Text style={styles.statusText}>
            {serviceHealth?.status === 'healthy' ? 'Service Connected' : 'Service Issues'}
          </Text>
          {serviceHealth && (
            <Text style={styles.sessionCountText}>
              {serviceHealth.active_sessions} active sessions
            </Text>
          )}
        </View>

        {/* Focus State Display */}
        <Animated.View
          style={[
            styles.focusStateContainer,
            {
              backgroundColor: FocusTrackingService.getFocusStateColor(currentFocusState) + '20',
              borderColor: FocusTrackingService.getFocusStateColor(currentFocusState),
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <Ionicons
            name={FocusTrackingService.getFocusStateIcon(currentFocusState)}
            size={48}
            color={FocusTrackingService.getFocusStateColor(currentFocusState)}
          />
          <Text style={[styles.focusStateText, { color: FocusTrackingService.getFocusStateColor(currentFocusState) }]}>
            {currentFocusState}
          </Text>
          <Text style={styles.focusScoreText}>{focusScore.toFixed(1)}%</Text>
        </Animated.View>

        {/* Session Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(sessionStats.sessionDuration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getFocusPercentage().toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Focus Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionStats.totalFrames}</Text>
            <Text style={styles.statLabel}>Frames</Text>
          </View>
        </View>

        {/* Session Info */}
        {currentSession && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionIdText}>Session: {currentSession.session_id}</Text>
            <Text style={styles.userIdText}>User: {currentSession.user_id}</Text>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!sessionActive ? (
            <TouchableOpacity 
              style={[styles.startButton, isStartingSession && styles.disabledButton]} 
              onPress={startSession}
              disabled={isStartingSession}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>
                {isStartingSession ? "Starting..." : "Start Focus Session"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.endButton, isEndingSession && styles.disabledButton]} 
              onPress={endSession}
              disabled={isEndingSession}
            >
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={styles.endButtonText}>
                {isEndingSession ? "Ending..." : "End Session"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <BottomNav activeRoute="Focus" />
    </SafeAreaView>
  );
}
