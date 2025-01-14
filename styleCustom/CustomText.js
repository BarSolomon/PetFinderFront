import React from 'react';
import { Text, StyleSheet } from 'react-native';

const CustomText = ({ children, style }) => {
  return <Text style={[styles.text, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 24, // גודל הטקסט
    fontWeight: '600', // משקל טקסט בינוני
    color: '#333', // צבע הטקסט
    marginBottom: 16, // מרחק תחתון מהאלמנט הבא
    textAlign: 'left', // יישור לשמאל
    textTransform: 'none', // אותיות רגילות
    letterSpacing: 0.5, // מרווח בין האותיות
    marginVertical: 16,
    marginLeft: 16,
    fontFamily: 'tenor-sans ', // גופן עכשווי
    textShadowColor: '#000', // צבע הצל
    textShadowOffset: { width: 0, height: 1 }, // מרחק הצל מהטקסט
    textShadowRadius: 1, // רדיוס הצל
  },
});

export default CustomText;
