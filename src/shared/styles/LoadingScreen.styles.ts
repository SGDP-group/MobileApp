import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
  },
  title:{
    color: '#fff',
    marginTop: 15,
    fontWeight: '600',
    fontSize: 16
  }

 
});
