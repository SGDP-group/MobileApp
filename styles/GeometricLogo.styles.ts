import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors'; 

export const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.logoBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.logoBorder,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    // Android Shadow
    elevation: 10,
  },
  logoDiamond: {
    width: 100,
    height: 100,
    backgroundColor: Colors.diamond,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  logoDot: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: Colors.dot,
  },
});