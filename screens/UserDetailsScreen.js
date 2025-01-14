import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import CustomButton from '../styleCustom/CustomButton';

const UpdateDetailsScreen = () => {
  const navigation = useNavigation();
  const { userId } = useUser(); // הנחת שה-UserID נשמר ב-UserContext
  const [userInfo, setUserInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
  });

  // Load user details from the server when the screen loads
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/auth/user/${userId}`);
        const data = await response.json();
        if (response.ok) {
          setUserInfo({
            email: data.userInfo.email,
            firstName: data.userInfo.firstName,
            lastName: data.userInfo.lastName,
            phone: data.userInfo.phone || '',
            city: data.userInfo.city || '',
          });
        } else {
          Alert.alert('Error', 'Failed to load user details');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        Alert.alert('Error', 'An error occurred while fetching user details');
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setUserInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
  };

  // Save updated user details
  const handleSave = async () => {
    try {
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/auth/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      if (response.ok) {
        Alert.alert('Success', 'Details updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update details');
      }
    } catch (error) {
      console.error('Error updating details:', error);
      Alert.alert('Error', 'An error occurred while updating details');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Email (cannot be changed):</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#f0f0f0' }]}
          value={userInfo.email}
          editable={false}
        />

        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          value={userInfo.firstName}
          onChangeText={(text) => handleInputChange('firstName', text)}
        />

        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          value={userInfo.lastName}
          onChangeText={(text) => handleInputChange('lastName', text)}
        />

        <Text style={styles.label}>Phone (Optional):</Text>
        <TextInput
          style={styles.input}
          value={userInfo.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          keyboardType='phone-pad'
        />

        <Text style={styles.label}>City:</Text>
        <TextInput
          style={styles.input}
          value={userInfo.city}
          onChangeText={(text) => handleInputChange('city', text)}
        />

        <View style={styles.buttonContainer}>
          <CustomButton title="Save Changes" onPress={handleSave} color="#4CAF50" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    marginLeft: 20,
  },
  input: {
    height: 40,
    width: '90%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
    marginLeft: 20,
  },
  buttonContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
});

export default UpdateDetailsScreen;
