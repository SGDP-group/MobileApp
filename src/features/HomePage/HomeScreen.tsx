import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import {
  CalendarEventResponse,
  googleCalendarService,
} from "@services/googleCalendarService";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { getSafeErrorMessage } from "@utils/securityUtils";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QrScannerModal from "./components/QrScannerModal";
import { useQrCodeScanner } from "./hooks/useQrCodeScanner";
import { styles } from "./styles/home.styles";

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

export default function HomeScreen({ userInfo, onLogout }: HomeScreenProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const userName = userInfo?.user?.name ?? "User";
  const snapInterval = 234;
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    isScannerVisible,
    isProcessingScan,
    scannedQrPayload,
    openScanner,
    closeScanner,
    handleScan,
  } = useQrCodeScanner();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 5) return "Good Evening";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedDate = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = days[currentDate.getDay()];
    const monthName = months[currentDate.getMonth()];
    const day = currentDate.getDate();

    return `${dayName}, ${monthName} ${day}`;
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentScrollIndex(viewableItems[0].index);
    }
  }).current;

  const quickActions = [
    { id: "start", label: "Start Focus\nSession", icon: "play" as const },
    { id: "plan", label: "Plan Tasks", icon: "checkmark-circle" as const },
    { id: "analytics", label: "Analytics", icon: "stats-chart" as const },
    { id: "settings", label: "Settings", icon: "settings" as const },
  ] as const;

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const data = await googleCalendarService.getEvents(12);
        setEvents(data);
      } catch (error) {
        // Use safe error message that doesn't expose sensitive details
        const safeMessage = getSafeErrorMessage(error);
        Alert.alert("Calendar", safeMessage);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  const getEventStart = (event: CalendarEventResponse): Date | null => {
    const startValue = event.start?.dateTime || event.start?.date;
    if (!startValue) return null;
    const startDate = new Date(startValue);
    if (Number.isNaN(startDate.getTime())) return null;
    return startDate;
  };

  const getEventEnd = (event: CalendarEventResponse): Date | null => {
    const endValue = event.end?.dateTime || event.end?.date;
    if (!endValue) return null;
    const endDate = new Date(endValue);
    if (Number.isNaN(endDate.getTime())) return null;
    return endDate;
  };

  const formatLead = (startDate: Date | null): string => {
    if (!startDate) return "UP NEXT";
    const diffMs = startDate.getTime() - Date.now();
    if (diffMs <= 0) return "STARTING";
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `IN ${diffMins} MINS`;
    const diffHours = Math.round(diffMins / 60);
    return `IN ${diffHours} HOUR${diffHours > 1 ? "S" : ""}`;
  };

  const formatTime = (startDate: Date | null): string => {
    if (!startDate) return "";
    return startDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return "";
    const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
    const totalMins = Math.round(diffMs / 60000);
    if (totalMins < 60) return `${totalMins} mins`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}mins`;
  };

  const filteredEvents = useMemo(() => {
    if (events.length === 0) return [];
    const now = Date.now();
    const next24Hours = now + 24 * 60 * 60 * 1000;
    const upcoming = events.filter((event) => {
      const startDate = getEventStart(event);
      if (!startDate) return false;
      const time = startDate.getTime();
      return time >= now && time <= next24Hours;
    });

    if (upcoming.length > 0) {
      return upcoming.slice(0, 6);
    }

    return events.slice(0, 6);
  }, [events]);

  const upNextData = useMemo(() => {
    if (isLoadingEvents) {
      return [{ id: "loading", type: "loading" as const }];
    }

    if (filteredEvents.length === 0) {
      return [{ id: "empty", type: "empty" as const }];
    }

    return filteredEvents.map((event) => ({
      id: event.id,
      type: "event" as const,
      event,
    }));
  }, [filteredEvents, isLoadingEvents]);

  const renderUpNextItem = (
    item: ListRenderItemInfo<
      | { id: string; type: "loading" }
      | { id: string; type: "empty" }
      | { id: string; type: "event"; event: CalendarEventResponse }
    >,
  ) => {
    if (item.item.type === "loading") {
      return (
        <View style={styles.eventCard}>
          <Text style={styles.eventLead}>LOADING</Text>
          <Text style={styles.eventTitle}>Fetching events...</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="time-outline" size={14} color="#8DA7B5" />
            <Text style={styles.eventMetaText}>Please wait</Text>
          </View>
        </View>
      );
    }

    if (item.item.type === "empty") {
      return (
        <View style={styles.eventCard}>
          <Text style={styles.eventLead}>NO EVENTS</Text>
          <Text style={styles.eventTitle}>Nothing upcoming</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="time-outline" size={14} color="#8DA7B5" />
            <Text style={styles.eventMetaText}>Create a new event</Text>
          </View>
          <TouchableOpacity
            style={styles.eventActionButton}
            onPress={() => navigation.navigate("Calendar")}
          >
            <Text style={styles.eventActionText}>Open Calendar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const startDate = getEventStart(item.item.event);
    const endDate = getEventEnd(item.item.event);

    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventLead}>{formatLead(startDate)}</Text>
        <Text style={styles.eventTitle}>
          {item.item.event.summary || "Untitled Event"}
        </Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={14} color="#8DA7B5" />
          <Text style={styles.eventMetaText}>{formatTime(startDate)}</Text>
          {endDate && (
            <>
              <View style={styles.eventDivider} />
              <Text style={styles.eventMetaText}>
                {formatDuration(startDate, endDate)}
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.eventActionButton}
          onPress={() => navigation.navigate("Calendar")}
        >
          <Text style={styles.eventActionText}>Start Focus Session Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "plan":
        navigation.navigate("Calendar");
        return;
      case "start":
        Alert.alert("Focus Session", "Focus sessions are coming soon.");
        return;
      case "analytics":
        Alert.alert("Analytics", "Analytics are coming soon.");
        return;
      case "settings":
        Alert.alert("Settings", "Settings are coming soon.");
        return;
      default:
        Alert.alert("Action", "This action is coming soon.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        scrollEventThrottle={16}
        decelerationRate={0.998}
        removeClippedSubviews={false}
        overScrollMode="never"
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
            <Text style={styles.title}>
              {getGreeting()}, {userName}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openScanner}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color="#E5F7FF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => Alert.alert("Notifications", "Coming soon.")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#E5F7FF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => Alert.alert("Profile", "Coming soon.")}
            >
              {userInfo?.user?.photo ? (
                <Image
                  source={{ uri: userInfo.user.photo }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={18} color="#0B1A20" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SYSTEM ONLINE</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroTitle}>Ready to Focus</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="time-outline" size={16} color="#54D2FF" />
            <Text style={styles.heroMetaText}>Clock: Connected</Text>
          </View>
          <View style={styles.heroMetaRow}>
            <Ionicons name="home-outline" size={16} color="#54D2FF" />
            <Text style={styles.heroMetaText}>Door: Connected</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Calendar")}>
            <Text style={styles.sectionAction}>View Calendar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={upNextData}
          renderItem={renderUpNextItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upNextRow}
          nestedScrollEnabled
          decelerationRate={0.99}
          snapToInterval={snapInterval}
          snapToAlignment="center"
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: snapInterval * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {upNextData.length > 1 && upNextData[0].type === "event" && (
          <View style={styles.scrollIndicatorContainer}>
            {upNextData.map((_, index) => (
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

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name={action.icon} size={24} color="#CDEEFF" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <QrScannerModal
        visible={isScannerVisible}
        isProcessingScan={isProcessingScan}
        onClose={closeScanner}
        onScan={handleScan}
      />

      <BottomNav activeRoute="Home" />
      
      {onLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
