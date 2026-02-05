import { useState } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@features/auth/styles/welcome.styles";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GeometricLogo } from "@shared/components/GeometricLogo";
import { SocialButton } from "@shared/components/SocialButton";

const BG_IMAGE = require("@assets/images/login-bg.jpg");

interface WelcomeScreenProps {
  onLoginSuccess?: (userInfo: any) => void;
}

export default function WelcomeScreen({ onLoginSuccess }: WelcomeScreenProps) {
  const [userInfo, setUserInfo] = useState<any>(null);

  // ios  - 320294722121-16em0d7qgg1kjkui1dn6vdur3n0euelg.apps.googleusercontent.com
  // Android - 320294722121-3u7p22o9jroqbf89unduu5qn22290j8s.apps.googleusercontent.com
  // web - 320294722121-aer10knc1tfkaqd7r6l4glan2l6t6er6.apps.googleusercontent.com
  const signIn = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Web Support",
        "Native Google Sign-In is not supported on Web. Please implement Google Identity Services for Web.",
      );
      return;
    }

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        setUserInfo(response.data);
        console.log("User Info:", response.data);
        // Call the callback to notify parent navigator
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
      } else {
        // Sign in cancelled
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert("Sign in is in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Play services not available");
            break;
          default:
            Alert.alert("An error occurred", error.message);
        }
      } else {
        Alert.alert("An unknown error occurred");
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={BG_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.appName}>FocusFrame</Text>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Connect your space</Text>
              <Text style={styles.heroTitle}>Master your time</Text>
            </View>

            <GeometricLogo />
          </View>

          <View style={styles.footerContainer}>
            <SocialButton
              title="Sign up with Google"
              variant="primary"
              onPress={signIn}
            />

            <SocialButton
              title="Sign in with Google"
              variant="secondary"
              onPress={signIn}
            />

            <Text style={styles.legalText}>
              By continuing, you agree to our{"\n"}
              <Text style={styles.linkText}>Terms</Text> &{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
