import { useLoading } from "@/src/shared/contexts/LoadingContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import React, { useState } from "react";
import {
    FlatList,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SessionData, SessionStatistics } from "../../services/analyticsService";
import { styles } from "./styles/allAnalytics.styles";

export default function AllAnalyticsScreen() {
  const route = useRoute();
  const [refreshing, setRefreshing] = useState(false);
  const { setIsLoading } = useLoading();

  // Get data from navigation params
  const sessionData = (route.params as any)?.sessionData as SessionData | null;
  const sessionStatistics = (route.params as any)?.sessionStatistics as SessionStatistics | null;

  const onRefresh = async () => {
    try {
      setIsLoading(true, "Refreshing metrics...");
      setRefreshing(true);
      // Refresh logic can be added here if needed in the future
    } catch (error) {
      console.warn("Error refreshing analytics:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const renderAnalyticsCard = ({ item }: { item: AnalyticsCard }) => (
    <View style={[styles.analyticsCard, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardValue}>{item.value}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      {item.extraInfo && <Text style={styles.cardExtraInfo}>{item.extraInfo}</Text>}
    </View>
  );

  const getAnalyticsCards = (): AnalyticsCard[] => {
    if (!sessionData) return [];

    const { deep_work_metrics, distraction_analytics, gamification_stats } = sessionData;

    const cards: AnalyticsCard[] = [
      {
        id: "focus-score",
        title: "Focus Score",
        value: `${sessionData.focus_score.toFixed(1)}%`,
        subtitle: "Current session performance",
        icon: "star",
        iconColor: "#4DE3B1",
        backgroundColor: "#0E1C22",
      },
      {
        id: "deep-work",
        title: "Deep Work",
        value: `${(deep_work_metrics.deep_work_duration_minutes / 60).toFixed(1)}h`,
        subtitle: "Current session focus time",
        extraInfo: `Efficiency: ${deep_work_metrics.deep_work_percentage}%`,
        icon: "time",
        iconColor: "#54D2FF",
        backgroundColor: "#1A2429",
      },
      {
        id: "interruptions",
        title: "Interruptions",
        value: `${deep_work_metrics.interruptions_count}`,
        subtitle: "Session interruptions",
        extraInfo: "Keep distractions minimal",
        icon: "warning",
        iconColor: "#FF9F40",
        backgroundColor: "#0E1C22",
      },
      {
        id: "streak",
        title: "Current Streak",
        value: `${gamification_stats.streak_days} days`,
        subtitle: "Keep it going!",
        extraInfo: `Level: ${gamification_stats.level}`,
        icon: "flame",
        iconColor: "#FF6B6B",
        backgroundColor: "#1A2429",
      },
      {
        id: "phone-pickups",
        title: "Phone Pickups",
        value: `${distraction_analytics.phone_pickups}`,
        subtitle: "Phone distractions",
        extraInfo: "Stay focused on your work",
        icon: "phone-portrait",
        iconColor: "#A78BFA",
        backgroundColor: "#0E1C22",
      },
      {
        id: "frames",
        title: "Frames Analyzed",
        value: `${sessionData.frames_analyzed}`,
        subtitle: "Data points processed",
        extraInfo: "High accuracy tracking",
        icon: "camera",
        iconColor: "#54D2FF",
        backgroundColor: "#1A2429",
      },
    ];

    // Add session statistics if available
    if (sessionStatistics) {
      cards.push(
        {
          id: "total-sessions",
          title: "Total Sessions",
          value: `${sessionStatistics.total_sessions}`,
          subtitle: "All completed sessions",
          extraInfo: `Avg: ${sessionStatistics.average_session_duration_minutes}min`,
          icon: "list",
          iconColor: "#F4C552",
          backgroundColor: "#0E1C22",
        },
        {
          id: "total-hours",
          title: "Total Focus Hours",
          value: `${sessionStatistics.total_focused_hours.toFixed(1)}h`,
          subtitle: "Lifetime focused time",
          extraInfo: `Trend: ${sessionStatistics.productivity_trend}`,
          icon: "time",
          iconColor: "#4DE3B1",
          backgroundColor: "#1A2429",
        },
        {
          id: "avg-focus",
          title: "Average Focus",
          value: `${sessionStatistics.average_focus_score.toFixed(1)}%`,
          subtitle: "Across all sessions",
          extraInfo: `Best time: ${sessionStatistics.most_productive_time}`,
          icon: "analytics",
          iconColor: "#54D2FF",
          backgroundColor: "#0E1C22",
        }
      );
    }

    return cards;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={getAnalyticsCards()}
        renderItem={renderAnalyticsCard}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Performance Metrics</Text>
              <Text style={styles.subtitle}>Your focus insights</Text>
            </View>
            {/* <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
            </View> */}
          </View>
        }
      />

      <BottomNav activeRoute="Analytics" />
    </SafeAreaView>
  );
}

interface AnalyticsCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  extraInfo?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
}
