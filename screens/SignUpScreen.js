// screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import CustomTextInput from '../styleCustom/CustomTextInput';
import CustomButton from '../styleCustom/CustomButton';

export default function SignUpScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('');

    const handleSignUp = async () => {
        // בדיקת שדות ריקים
        if (!email || !firstName || !lastName || !password || !city) {
            Alert.alert('Missing Fields', 'Please fill in all the fields.');
            return;
        }

        try {
            const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    password,
                    city,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                Alert.alert('Success', data.message);
                // Navigate to another screen or perform other actions
                navigation.navigate('Login'); // example navigation
            } else {
                const errorData = await response.json();
                Alert.alert('Registration Failed', errorData.message);
            }
        } catch (e) {
            console.error('Registration failed: ', e);
            Alert.alert('Registration Error', 'An error occurred while trying to register');
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <View style={styles.container}>
                    <Text style={styles.title}>Sign Up</Text>
                    <CustomTextInput 
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        maxLength={50}
                    />
                    <CustomTextInput 
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        maxLength={50}
                    />
                    <CustomTextInput 
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        maxLength={50}
                    />
                    <CustomTextInput 
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        maxLength={50}
                    />
                    <CustomTextInput 
                        placeholder="City"
                        value={city}
                        onChangeText={setCity}
                        maxLength={50}
                    />
                    <View style={styles.buttonContainer}>
                        <CustomButton title="Sign Up" onPress={handleSignUp} />
                    </View>
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    buttonContainer: {
        width: '100%',
    },
});
