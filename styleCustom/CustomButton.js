import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFA500', // צבע כתום
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // רק למכשירי אנדרואיד
    marginBottom: 8, // רווח מתחת לכפתור
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'tenor-sans ',
    fontWeight: 'bold',
  },
});

export default CustomButton;
