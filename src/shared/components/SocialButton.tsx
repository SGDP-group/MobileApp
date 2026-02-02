import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Colors } from "@shared/theme/colors";
import { styles } from "@shared/styles/SocialButton.styles";

interface SocialButtonProps {
  title: string;
  variant: "primary" | "secondary";
  onPress: () => void;
  iconName?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  title,
  variant,
  onPress,
}) => {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPrimary ? styles.primaryBg : styles.secondaryBg,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.iconContainer}>
        {isPrimary ? (
          <FontAwesome name="google" size={20} color={Colors.textPrimary} />
        ) : (
          <Ionicons
            name="person-circle-outline"
            size={24}
            color={Colors.textSecondary}
          />
        )}
      </View>
      <Text style={isPrimary ? styles.textPrimary : styles.textSecondary}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
