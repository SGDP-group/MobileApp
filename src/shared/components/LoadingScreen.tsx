import { styles } from "@shared/styles/LoadingScreen.styles";
import { colors } from "@shared/theme/colors";
import { ActivityIndicator, Text, View } from "react-native";


interface LoadingScreenProps {
  title: string;
}
export function LoadingScreen({ title }: LoadingScreenProps) {
  return (
    
            <View style={styles.container}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
  

