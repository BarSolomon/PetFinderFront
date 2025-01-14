// CustomTextNormal.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import * as Font from 'expo-font';

const CustomTextNormal = ({ style, children, ...props }) => {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,          // גודל פונטים רגיל
    color: '#333',         // צבע טקסט כהה כדי להתאים לעיצוב מודרני
    lineHeight: 24,        // רווח בין השורות
    fontFamily: 'tenor-sans ',  // שינוי גופן למראה מודרני (תעדכן בהתאם לגופן שלך)
  },
});

export default CustomTextNormal;
