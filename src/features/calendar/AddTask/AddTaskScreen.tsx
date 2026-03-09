import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@features/calendar/AddTask/styles/addTask.styles";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TaskActionType = "quick" | "ai";

interface TaskActionCardProps {
  type: TaskActionType;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function TaskActionCard({
  type,
  title,
  subtitle,
  onPress,
}: TaskActionCardProps) {
  const isAI = type === "ai";

  return (
    <TouchableOpacity
      style={isAI ? styles.aiCard : styles.optionCard}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={isAI ? styles.aiIconWrap : styles.optionIconWrap}>
        <Ionicons
          name={isAI ? "sparkles" : "add-circle-outline"}
          size={20}
          color={colors.text}
        />
      </View>
      <View style={styles.optionTextWrap}>
        <Text style={isAI ? styles.aiTitle : styles.optionTitle}>{title}</Text>
        <Text style={isAI ? styles.aiSubtitle : styles.optionSubtitle}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AddTaskScreen() {
  const navigation = useNavigation<RootNavigationProp>();

  const handleAddTaskPress = () => {
    navigation.navigate("AddTaskDetails");
  };

  const handleAddEventPress = () => {
    Alert.alert("Add Event", "Add Event flow will be connected next.");
  };

  const handleAIBreakdownPress = () => {
    Alert.alert("AI Breakdown", "AI Breakdown flow will be connected next.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.divider} />

      <View style={styles.content}>
        <TaskActionCard
          type="quick"
          title="Add Task"
          subtitle="Set task details manually"
          onPress={handleAddTaskPress}
        />

        <TaskActionCard
          type="quick"
          title="Add Event"
          subtitle="Create a calendar event manually"
          onPress={handleAddEventPress}
        />

        <TaskActionCard
          type="ai"
          title="AI Breakdown"
          subtitle="Let AI plan the sub tasks for you"
          onPress={handleAIBreakdownPress}
        />
      </View>

      <BottomNav activeRoute="Home" />
    </SafeAreaView>
  );
}
