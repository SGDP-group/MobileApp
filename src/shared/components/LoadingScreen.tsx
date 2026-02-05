import { styles } from "@shared/styles/LoadingScreen.styles";
import { colors } from "@shared/theme/colors";
import { ActivityIndicator, Text, View } from "react-native";

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}
