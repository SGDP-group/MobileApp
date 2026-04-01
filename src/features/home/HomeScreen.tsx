import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import StyledAlert from "@shared/components/StyledAlert";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceProvisioningModal from "./../provisioning/screens/DeviceProvisioningScreen"; // Import the modal
import { FocusHeroCard } from "./components/FocusHeroCard";
import { HomeHeader } from "./components/HomeHeader";
// import QrScannerModal from "./components/QrScannerModal";
import { QuickActionsSection } from "./components/QuickActionsSection";
import { SystemStatusPill } from "./components/SystemStatusPill";
import { TaskQueueModal } from "./components/TaskQueueModal";
import { UpNextSection } from "./components/UpNextSection";
import { HomeTask, useHomeTasks } from "./home.tasks";
import { styles } from "./styles/home.styles";

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

const QUICK_ACTIONS = [
  
  { id: "plan", label: "Plan Tasks", icon: "checkmark-circle" as const },
  { id: "analytics", label: "Analytics", icon: "stats-chart" as const },
  { id: "addTaskAI", label: "Add Task by AI", icon: "sparkles" as const },
  { id: "addTaskManual", label: "Add Task", icon: "add-circle" as const },
  // { id: "start", label: "Start Focus\nSession", icon: "play" as const },
  // { id: "clearToday", label: "Clear Today", icon: "trash" as const },
] as const;

export default function HomeScreen({ userInfo }: HomeScreenProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const userName = userInfo?.user?.name ?? "User";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskQueueModalVisible, setTaskQueueModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HomeTask | null>(null);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void }>;
    type?: "info" | "success" | "warning" | "error";
  }>({
    title: "",
    message: "",
    buttons: [],
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void }> = [{ text: "OK", onPress: () => setAlertVisible(false) }],
    type?: "info" | "success" | "warning" | "error"
  ) => {
    setAlertConfig({ title, message, buttons, type });
    setAlertVisible(true);
  };
  // const {
  //   isScannerVisible,
  //   isProcessingScan,
  //   scannedQrPayload,
  //   clearScannedQrPayload,
  //   openScanner,
  //   closeScanner,
  //   handleScan,
  // } = useQrCodeScanner();




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

  const handleOpenProvisioning = useCallback(() => {
    navigation.navigate("DeviceProvisioning", {
      prefilledSsid: "", 
    });
  }, [navigation]);



  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case "addTaskAI":
        navigation.navigate("AIBreakdownDetails");
        return;
      case "addTaskManual":
        navigation.navigate("AddTaskDetails");
        return;
      case "plan":
        navigation.navigate("Calendar");
        return;
      case "analytics":
        navigation.navigate("Analytics");
        return;
      default:
        showAlert("Action", "This action is coming soon.", undefined, "info");
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
          onOpenScanner={() => setSetupModalVisible(true)}
          // onOpenNotifications={() => showAlert("Notifications", "Coming soon.")}
          onOpenProfile={() => showAlert("Profile", "Coming soon.", undefined, "info")}
        />

        <SystemStatusPill />
        <FocusHeroCard />

        <UpNextSection
          upNextData={upNextData}
          onOpenTaskQueue={handleOpenTaskQueue}
        />
      <DeviceProvisioningModal 
        visible={setupModalVisible} 
        onClose={() => setSetupModalVisible(false)} 
      />
        <QuickActionsSection
          actions={QUICK_ACTIONS}
          onActionPress={handleQuickAction}
        />
      </ScrollView>


      {/* <QrScannerModal
        visible={isScannerVisible}
        isProcessingScan={isProcessingScan}
        onClose={closeScanner}
        onScan={handleScan}
      /> */}

      <BottomNav activeRoute="Home" />

      <TaskQueueModal
        visible={taskQueueModalVisible}
        task={selectedTask}
        onClose={handleCloseTaskQueue}
      />

      <StyledAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
}
