import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QrScannerModal from "./components/QrScannerModal";
import { QuickActionCard } from "./components/QuickActionCard";
import { TaskQueueModal } from "./components/TaskQueueModal";
import { UpNextCard } from "./components/UpNextCard";
import { getFormattedDate, getGreeting } from "./home.helpers";
import { HomeTask, useHomeTasks } from "./home.tasks";
import { useQrCodeScanner } from "./hooks/useQrCodeScanner";

import { styles } from "./styles/home.styles";

const UP_NEXT_CARD_SNAP_INTERVAL = 234;

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

export default function HomeScreen({ userInfo, onLogout }: HomeScreenProps) {

  const navigation = useNavigation<RootNavigationProp>();
  const userName = userInfo?.user?.name ?? "User";
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskQueueModalVisible, setTaskQueueModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HomeTask | null>(null);
  const {
    isScannerVisible,
    isProcessingScan,
    openScanner,
    closeScanner,
    handleScan,
  } = useQrCodeScanner();

  const { upNextData } = useHomeTasks();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);


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

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "plan":
        navigation.navigate("Calendar");
        return;
      case "start":
        navigation.navigate("Focus");
        return;
      case "analytics":
        navigation.navigate("Analytics");
        return;
      case "settings":
        Alert.alert("Settings", "Settings are coming soon.");
        return;
      default:
        Alert.alert("Action", "This action is coming soon.");
    }
  };

  const handleOpenTaskQueue = (task?: HomeTask) => {
    if (task) {
      setSelectedTask(task);
      setTaskQueueModalVisible(true);
      return;
    }

    const firstTaskItem = upNextData.find((item) => item.type === "task");
    setSelectedTask(firstTaskItem && firstTaskItem.type === "task" ? firstTaskItem.task : null);
    setTaskQueueModalVisible(true);
  };

  const handleCloseTaskQueue = () => {
    setTaskQueueModalVisible(false);
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
            <Text style={styles.dateText}>{getFormattedDate(currentDate)}</Text>
            <Text style={styles.title}>
              {getGreeting(currentDate)}, {userName}
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
            <Text style={styles.sectionAction}>View Tasks</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={upNextData}
          renderItem={({ item }) => (
            <UpNextCard item={item} onOpenTaskQueue={handleOpenTaskQueue} />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upNextRow}
          nestedScrollEnabled
          decelerationRate={0.99}
          snapToInterval={UP_NEXT_CARD_SNAP_INTERVAL}
          snapToAlignment="center"
          getItemLayout={(_, index) => ({
            length: UP_NEXT_CARD_SNAP_INTERVAL,
            offset: UP_NEXT_CARD_SNAP_INTERVAL * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {upNextData.length > 1 && upNextData[0].type === "task" && (
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
            <QuickActionCard
              key={action.id}
              label={action.label}
              icon={action.icon}
              onPress={() => handleQuickAction(action.id)}
            />
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

      <TaskQueueModal
        visible={taskQueueModalVisible}
        task={selectedTask}
        onClose={handleCloseTaskQueue}
      />
    </SafeAreaView>
  );
}
