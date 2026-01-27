import React, { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Platform, // Added Platform import
  SafeAreaView,
  StatusBar,
  Text,
  View
} from 'react-native';

import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes
} from '@react-native-google-signin/google-signin';
import { GeometricLogo } from '../components/GeometricLogo';
import { SocialButton } from '../components/SocialButton';
import { styles } from './welcome.styles';


const BG_IMAGE = require('../assets/images/login-bg.jpg');

export default function WelcomeScreen() {
  // 1. Hooks must be INSIDE the component
  const [userInfo, setUserInfo] = useState<any>(null);



  // ios  - 320294722121-16em0d7qgg1kjkui1dn6vdur3n0euelg.apps.googleusercontent.com
  // Android - 320294722121-3u7p22o9jroqbf89unduu5qn22290j8s.apps.googleusercontent.com
  // web - 320294722121-aer10knc1tfkaqd7r6l4glan2l6t6er6.apps.googleusercontent.com
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        GoogleSignin.configure({
          webClientId: '320294722121-aer10knc1tfkaqd7r6l4glan2l6t6er6.apps.googleusercontent.com',
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          offlineAccess: false,
          forceCodeForRefreshToken: false,
          iosClientId: '<FROM DEVELOPER CONSOLE>', 
          profileImageSize: 120,
        });
      } catch (e) {
        console.error("Google Sign-In Config Error:", e);
      }
    }
  }, []);

  // 3. Define the Sign-In function INSIDE the component
  const signIn = async () => {
    // Web Guard: Stop execution if on Web
    if (Platform.OS === 'web') {
      Alert.alert('Web Support', 'Native Google Sign-In is not supported on Web. Please implement Google Identity Services for Web.');
      return;
    }

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        
        setUserInfo(response.data);
        console.log("User Info:", response.data);
      } else {
        // Sign in cancelled
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert('Sign in is in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Play services not available');
            break;
          default:
            Alert.alert('An error occurred', error.message);
        }
      } else {
        Alert.alert('An unknown error occurred');
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
              By continuing, you agree to our{'\n'}
              <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}