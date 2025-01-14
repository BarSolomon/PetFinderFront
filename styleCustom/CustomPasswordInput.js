// styleCustom/CustomPasswordInput.js
import React, { useState } from 'react';
import { TextInput, StyleSheet, Platform, Dimensions, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ייבוא אייקונים

const { width } = Dimensions.get('window');

const CustomPasswordInput = ({ placeholder, onChangeText, value, maxLength }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        placeholderTextColor="#999" // צבע placeholder
        secureTextEntry={!showPassword} // הצגת הסיסמה כמו נקודות אם showPassword לא פעיל
        maxLength={maxLength}
        numberOfLines={1} // הגבלת מספר השורות לשורה אחת
      />
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setShowPassword(prevState => !prevState)}
      >
        <Ionicons
          name={showPassword ? 'eye' : 'eye-off'}
          size={20}
          color="#333"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.9, // רוחב התיבה מותאם ל-90% מרוחב המסך
    height: 50, // גובה תיבת הטקסט
    borderColor: '#ccc', // צבע הגבול
    borderWidth: 1, // עובי הגבול
    borderRadius: 25, // פינות מעוגלות
    backgroundColor: '#f9f9f9', // צבע רקע
    marginBottom: 16, // מרחק תחתון מהאלמנט הבא
    paddingHorizontal: 20, // מרחק אופקי בתוך התיבה
    fontSize: 16, // גודל הטקסט
    color: '#333', // צבע הטקסט
    shadowColor: '#000', // צבע הצל
    shadowOffset: { width: 0, height: 2 }, // הזזת הצל
    shadowOpacity: 0.2, // שקיפות הצל
    shadowRadius: 3, // רדיוס הצל
    elevation: 3, // עוצמת הצל באנדרואיד
    fontFamily: 'tenor-sans ', // פונט מותאם לפלטפורמה
    flexDirection: 'row', // הצגת התוכן בכיוון אופקי
    alignItems: 'center', // יישור התוכן במרכז
  },
  input: {
    flex: 1, // תופס את כל רוחב התיבה
  },
  iconContainer: {
    position: 'absolute', // מיקום מוחלט בצד ימין
    right: 10, // רווח מהקצה הימני
    height: '100%', // גובה התיבה
    justifyContent: 'center', // יישור האייקון במרכז
    alignItems: 'center', // יישור האייקון במרכז
  },
});

export default CustomPasswordInput;
