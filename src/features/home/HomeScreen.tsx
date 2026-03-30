import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusHeroCard } from "./components/FocusHeroCard";
import { HomeHeader } from "./components/HomeHeader";
import QrScannerModal from "./components/QrScannerModal";
import { QuickActionsSection } from "./components/QuickActionsSection";
import { SystemStatusPill } from "./components/SystemStatusPill";
import { TaskQueueModal } from "./components/TaskQueueModal";
import { UpNextSection } from "./components/UpNextSection";
import { HomeTask, useHomeTasks } from "./home.tasks";
import { useQrCodeScanner } from "./hooks/useQrCodeScanner";
import { styles } from "./styles/home.styles";

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

const QUICK_ACTIONS = [
  { id: "start", label: "Start Focus\nSession", icon: "play" as const },
  { id: "plan", label: "Plan Tasks", icon: "checkmark-circle" as const },
  { id: "analytics", label: "Analytics", icon: "stats-chart" as const },
  { id: "settings", label: "Settings", icon: "settings" as const },
] as const;

export default function HomeScreen({ userInfo }: HomeScreenProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const userName = userInfo?.user?.name ?? "User";
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

  const { upNextData, refreshTasks } = useHomeTasks();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);


  useFocusEffect(
    useCallback(() => {
      void refreshTasks();
    }, [refreshTasks]),
  );

  const handleQuickAction = useCallback((actionId: string) => {
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
      // case "settings":
      //   Alert.alert("Settings", "Settings are coming soon.");
      //   return;
      default:
        Alert.alert("Action", "This action is coming soon.");
    }
  }, [navigation]);

  const handleOpenTaskQueue = useCallback((task?: HomeTask) => {
    if (task) {
      setSelectedTask(task);
      setTaskQueueModalVisible(true);
      return;
    }

    const firstTaskItem = upNextData.find((item) => item.type === "task");
    setSelectedTask(firstTaskItem && firstTaskItem.type === "task" ? firstTaskItem.task : null);
    setTaskQueueModalVisible(true);
  }, [upNextData]);

  const handleCloseTaskQueue = useCallback(() => {
    setTaskQueueModalVisible(false);
  }, []);

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
        <HomeHeader
          currentDate={currentDate}
          userName={userName}
          avatarUri={userInfo?.user?.photo}
          onOpenScanner={openScanner}
          // onOpenNotifications={() => Alert.alert("Notifications", "Coming soon.")}
          onOpenProfile={() => Alert.alert("Profile", "Coming soon.")}
        />

        <SystemStatusPill />
        <FocusHeroCard />

        <UpNextSection
          upNextData={upNextData}
          onOpenTaskQueue={handleOpenTaskQueue}
        />

        <QuickActionsSection
          actions={QUICK_ACTIONS}
          onActionPress={handleQuickAction}
        />
      </ScrollView>


      <QrScannerModal
        visible={isScannerVisible}
        isProcessingScan={isProcessingScan}
        onClose={closeScanner}
        onScan={handleScan}
      />

      <BottomNav activeRoute="Home" />

      <TaskQueueModal
        visible={taskQueueModalVisible}
        task={selectedTask}
        onClose={handleCloseTaskQueue}
      />

      
    </SafeAreaView>
  );
}
