import React from 'react';
import { View, StyleSheet } from 'react-native';
import { styles } from '../styles/GeometricLogo.styles';

export const GeometricLogo = () => {
  return (
    <View style={styles.logoWrapper}>
      <View style={styles.logoCircle}>
        <View style={styles.logoDiamond}>
          <View style={styles.logoDot} />
        </View>
      </View>
    </View>
  );
};
