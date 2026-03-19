import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnalyticsService } from "../../services/analyticsService";
import { FocusSession } from "../../types/analytics";
import { styles } from "./styles/analytics.styles";

const CARD_SNAP_INTERVAL = 280;

export default function AnalyticsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const [sessionData, setSessionData] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      // Using a mock user ID for now - in real app this would come from auth context
      const data = await AnalyticsService.getFocusSession("user123");
      setSessionData(data);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      Alert.alert("Service Error", "Could not connect to analytics service");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessionData();
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentScrollIndex(viewableItems[0].index);
    }
  }).current;

  const renderAnalyticsCard = ({ item }: { item: AnalyticsCard }) => (
    <View style={[styles.analyticsCard, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardValue}>{item.value}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      {item.extraInfo && <Text style={styles.cardExtraInfo}>{item.extraInfo}</Text>}
    </View>
  );

  const getAnalyticsCards = (): AnalyticsCard[] => {
    if (!sessionData) return [];

    const { comprehensive_analytics } = sessionData;
    
    return [
      {
        id: "focus-score",
        title: "Focus Score",
        value: `${sessionData.focus_score.toFixed(1)}%`,
        subtitle: "Current session performance",
        icon: "target",
        iconColor: "#4DE3B1",
        backgroundColor: "#0E1C22",
      },
      {
        id: "deep-work",
        title: "Deep Work",
        value: `${comprehensive_analytics.deep_work_metrics.focus_duration.daily_total_hours.toFixed(1)}h`,
        subtitle: "Daily focus time",
        extraInfo: `Weekly: ${comprehensive_analytics.deep_work_metrics.focus_duration.weekly_total_hours.toFixed(1)}h`,
        icon: "time",
        iconColor: "#54D2FF",
        backgroundColor: "#1A2429",
      },
      {
        id: "efficiency",
        title: "Focus Efficiency",
        value: `${comprehensive_analytics.deep_work_metrics.focus_efficiency.toFixed(1)}%`,
        subtitle: "Productivity ratio",
        extraInfo: `Focus to rest: ${comprehensive_analytics.deep_work_metrics.focus_to_rest_ratio.toFixed(1)}:1`,
        icon: "trending-up",
        iconColor: "#F4C552",
        backgroundColor: "#0E1C22",
      },
      {
        id: "streak",
        title: "Current Streak",
        value: `${comprehensive_analytics.gamification_stats.focus_streaks.current_streak} days`,
        subtitle: "Keep it going!",
        extraInfo: `Longest: ${comprehensive_analytics.gamification_stats.focus_streaks.longest_streak} days`,
        icon: "flame",
        iconColor: "#FF6B6B",
        backgroundColor: "#1A2429",
      },
      {
        id: "distractions",
        title: "Distractions",
        value: `${comprehensive_analytics.distraction_analytics.interruption_count}`,
        subtitle: "Session interruptions",
        extraInfo: `Cost: ${comprehensive_analytics.distraction_analytics.context_switching_cost.total_minutes.toFixed(0)}min`,
        icon: "warning",
        iconColor: "#FF9F40",
        backgroundColor: "#0E1C22",
      },
      {
        id: "recovery",
        title: "Recovery Time",
        value: `${comprehensive_analytics.distraction_analytics.recovery_metrics.average_recovery_time_seconds.toFixed(0)}s`,
        subtitle: "Average refocus time",
        extraInfo: `${comprehensive_analytics.distraction_analytics.recovery_metrics.recovery_events} events`,
        icon: "refresh",
        iconColor: "#A78BFA",
        backgroundColor: "#1A2429",
      },
      {
        id: "completion",
        title: "Completion Rate",
        value: `${comprehensive_analytics.deep_work_metrics.session_completion_rate.toFixed(1)}%`,
        subtitle: "Session success rate",
        icon: "checkmark-circle",
        iconColor: "#4DE3B1",
        backgroundColor: "#0E1C22",
      },
      {
        id: "longest-streak",
        title: "Longest Focus",
        value: `${comprehensive_analytics.deep_work_metrics.longest_focus_streak.minutes.toFixed(1)}min`,
        subtitle: "Uninterrupted focus",
        icon: "timer",
        iconColor: "#54D2FF",
        backgroundColor: "#1A2429",
      },
    ];
  };

  const renderInsightCard = ({ item }: { item: string }) => (
    <View style={styles.insightCard}>
      <Ionicons name="bulb" size={20} color="#F4C552" />
      <Text style={styles.insightText}>{item}</Text>
    </View>
  );

  if (loading && !sessionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your focus insights</Text>
        </View>

        {sessionData && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
            </View>

            <FlatList
              data={getAnalyticsCards()}
              renderItem={renderAnalyticsCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
              nestedScrollEnabled
              decelerationRate={0.99}
              snapToInterval={CARD_SNAP_INTERVAL}
              snapToAlignment="center"
              getItemLayout={(_, index) => ({
                length: CARD_SNAP_INTERVAL,
                offset: CARD_SNAP_INTERVAL * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />

            {getAnalyticsCards().length > 1 && (
              <View style={styles.scrollIndicatorContainer}>
                {getAnalyticsCards().map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.scrollDot,
                      index === currentScrollIndex && styles.scrollDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Insights</Text>
            </View>

            <View style={styles.insightsContainer}>
              {sessionData.comprehensive_analytics.insights.map((insight, index) => (
                <View key={index} style={styles.insightWrapper}>
                  {renderInsightCard({ item: insight })}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

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
