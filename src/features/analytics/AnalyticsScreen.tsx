import { getStoredUserId } from "@/src/services/focusFrameUserService";
import { useLoading } from "@/src/shared/contexts/LoadingContext";
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
import { AnalyticsService, SessionData, SessionStatistics } from "../../services/analyticsService";
import { styles } from "./styles/analytics.styles";

const CARD_SNAP_INTERVAL = 280;

export default function AnalyticsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionStatistics, setSessionStatistics] = useState<SessionStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const { setIsLoading } = useLoading(); 

  const loadSessionData = async () => {
    try {
      setIsLoading(true,"Analyzing your focus session...");
      const userId = await getStoredUserId();
      if (!userId) {
        Alert.alert(
          "User Not Found",
          "No user information found. Please log in again.",
          [{ text: "OK", onPress: () => navigation.navigate({ name: "Welcome", params: undefined }) }]
        );
        return;
      }
      
      // Load both current session and overall statistics
      const [currentSession, statistics] = await Promise.all([
        AnalyticsService.getCurrentSession(userId.toString()),
        AnalyticsService.getUserStatistics(userId.toString())
      ]);
      
      setSessionData(currentSession);
      setSessionStatistics(statistics);
    } catch (error) {
      console.warn("Analytics data not available, showing empty data:", error);
      // Don't show alert, just continue with empty data
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, []);

  const onRefresh = () => {
    setIsLoading(true,"Refreshing analytics...");
    setRefreshing(true);
    loadSessionData();
    setIsLoading(false);
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

  const renderInsightCard = ({ item }: { item: string }) => (
    <View style={styles.insightCard}>
      <Ionicons name="bulb" size={20} color="#F4C552" />
      <Text style={styles.insightText}>{item}</Text>
    </View>
  );

 

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
                {getAnalyticsCards().map((card, index) => (
                  <View
                    key={card.id}
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
              {sessionData.personalized_insights.map((insight, index) => (
                <View key={`insight-${index}-${insight.slice(0, 10)}`} style={styles.insightWrapper}>
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
