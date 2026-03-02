import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@features/calendar/AddTask/styles/addTask.styles";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "@shared/components/BottomNav";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { colors } from "@shared/theme/colors";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
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
          size={24}
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
  const [taskName, setTaskName] = useState("");

  const handleQuickAddPress = () => {
    Alert.alert("Quick Add", "Quick Add flow will be connected next.");
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
          <Ionicons name="chevron-back" size={34} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.divider} />

      <View style={styles.content}>
        <Text style={styles.label}>Task Name</Text>
        <TextInput
          style={styles.input}
          placeholder="eg: Study for Physics exam"
          placeholderTextColor={colors.secondaryText}
          value={taskName}
          onChangeText={setTaskName}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="done"
          accessibilityLabel="Task name"
        />

        <TaskActionCard
          type="quick"
          title="Quick Add"
          subtitle="Set time and duration manually"
          onPress={handleQuickAddPress}
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
