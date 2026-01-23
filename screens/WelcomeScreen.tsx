import React from 'react';
import {
    ImageBackground,
    SafeAreaView,
    StatusBar,
    Text,
    View
} from 'react-native';

import { GeometricLogo } from '../components/GeometricLogo';
import { SocialButton } from '../components/SocialButton';
import { styles } from './welcome.styles';

const BG_IMAGE = require('../assets/images/login-bg.jpg');

export default function WelcomeScreen() {
  
  // Handlers for interaction
  const handleSignUp = () => console.log('Sign Up Pressed');
  const handleSignIn = () => console.log('Sign In Pressed');

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={BG_IMAGE } 
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
              onPress={handleSignUp} 
            />
            
            <SocialButton 
              title="Sign in with Google" 
              variant="secondary" 
              onPress={handleSignIn} 
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
