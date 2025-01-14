import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import CustomButton from '../styleCustom/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import CustomPasswordInput from '../styleCustom/CustomPasswordInput'; // הוספת CustomPasswordInput

const PasswordChangeScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // state לניהול מצב טעינה
  const navigation = useNavigation();
  const { userId } = useUser();

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    setLoading(true); // מתחילים טעינה
    console.log(userId);
    try {
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/auth/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Password changed successfully!');
        navigation.goBack(); // חזרה למסך ההגדרות
      } else {
        Alert.alert('Error', 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An error occurred while changing the password');
    } finally {
      setLoading(false); // מסיימים טעינה
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Enter New Password:</Text>
        <CustomPasswordInput
          placeholder="New Password"
          value={password}
          onChangeText={setPassword}
          maxLength={50}
          style={styles.input} // הוספת סגנון לתיבות הטקסט
        />

        <Text style={styles.label}>Confirm New Password:</Text>
        <CustomPasswordInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          maxLength={50}
          style={styles.input} // הוספת סגנון לתיבות הטקסט
        />

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" /> // גלגל טעינה
          ) : (
            <CustomButton
              title="Change Password"
              onPress={handleChangePassword}
              color="#4CAF50"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#fff',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'flex-start',
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginVertical: 8,
      marginLeft: 20,
    },
    input: {
      marginHorizontal: 20, // הוספת מרווח אופקי לתיבות הטקסט
    },
    buttonContainer: {
      marginTop: 20,
      marginHorizontal: 20,
    },
  });

export default PasswordChangeScreen;
