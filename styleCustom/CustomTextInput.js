// styleCustom/CustomTextInput.js
import React, { useState } from 'react';
import { TextInput, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CustomTextInput = ({ placeholder, onChangeText, value, maxLength, editable, style, multiline }) => {
  const [inputHeight, setInputHeight] = useState(40); // Default height
  return (
    <TextInput
    style={styles.input}
    placeholder={placeholder}
    onChangeText={onChangeText}
    value={value}
    placeholderTextColor="#999"
    maxLength={maxLength}
    multiline={multiline}
    numberOfLines={1}
    editable={editable} 
    onContentSizeChange={(event) => setInputHeight(event.nativeEvent.contentSize.height)}
    
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50, // גובה תיבת הטקסט
    width: width * 0.8, // רוחב התיבה מותאם ל-90% מרוחב המסך
    borderColor: '#ccc', // צבע הגבול
    borderWidth: 1, // עובי הגבול
    borderRadius: 25, // פינות מעוגלות
    paddingHorizontal: 20, // מרחק אופקי בתוך התיבה
    marginBottom: 16, // מרחק תחתון מהאלמנט הבא
    backgroundColor: '#f9f9f9', // צבע רקע
    fontSize: 16, // גודל הטקסט
    color: '#333', // צבע הטקסט
    shadowColor: '#000', // צבע הצל
    shadowOffset: { width: 0, height: 2 }, // הזזת הצל
    shadowOpacity: 0.2, // שקיפות הצל
    shadowRadius: 3, // רדיוס הצל
    elevation: 3, // עוצמת הצל באנדרואיד
    fontFamily: 'tenor-sans ', // פונט מותאם לפלטפורמה
  },
});

export default CustomTextInput;
