import React, { useState } from 'react';
import { Button, View , Text, StyleSheet, SafeAreaView, Image, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import CustomTextInput from '../styleCustom/CustomTextInput';
import CustomPasswordInput from '../styleCustom/CustomPasswordInput';
import CustomButton from '../styleCustom/CustomButton';

export default function LoginScreen({ navigation }) {
    const { setUserID, setUserEmail, setUserEmoji } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async () => {
        try {
            const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const { userId, userInfo } = data;

                await AsyncStorage.setItem('userId', userId);
                await AsyncStorage.setItem('userEmail', userInfo.email);
                setUserID(userId);
                setUserEmail(userInfo.email);

                // טען את האימוג'י השמור עבור המשתמש אם קיים
                const savedEmoji = await AsyncStorage.getItem(`userEmoji_${userId}`);
                if (savedEmoji) {
                    setUserEmoji(savedEmoji);
                } else {
                    setUserEmoji('../assets/default_image.jpeg'); // אימוג'י ברירת מחדל אם אין שמור
                }

                navigation.navigate('Home');
            } else {
                Alert.alert('Login Failed', 'Please check your email and password');
            }
        } catch (e) {
            console.error('Login failed: ', e);
            Alert.alert('Login Error', 'An error occurred while trying to log in');
        }
    };

    const handleQuickLogin = async () => {
        const userId = '6676eb43d71d59a5fbe2e6e8';
        const userEmail = 'nuriel.32@gmail.com';

        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('userEmail', userEmail);
        setUserID(userId);
        setUserEmail(userEmail);

        // טען את האימוג'י השמור עבור המשתמש אם קיים
        const savedEmoji = await AsyncStorage.getItem(`userEmoji_${userId}`);
        if (savedEmoji) {
            setUserEmoji(savedEmoji);
        } else {
            setUserEmoji('../assets/default_image.jpeg'); // אימוג'י ברירת מחדל אם אין שמור
        }

        navigation.navigate('Home');
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <View style={styles.container}>
                    <Image
                        source={require('../assets/PetFinderLogo.png')}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Sign In</Text>
                    <CustomTextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        maxLength={50}
                    />
                    <CustomPasswordInput
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        maxLength={50}
                    />
                    <View style={styles.buttonContainer}>
                        <CustomButton title="Sign In" onPress={handleSignIn} />
                    </View>
                    <View style={[styles.buttonContainer, styles.secondButton]}>
                        <CustomButton title="Quick Login" onPress={handleQuickLogin} />
                    </View>
                    <View style={[styles.buttonContainer, styles.secondButton]}>
                        <Button title="Sign Up" onPress={handleSignUp} />
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
    icon: {
        width: 300,
        height: 300,
        marginBottom: 0,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    buttonContainer: {
        width: '100%',
    },
    secondButton: {
        marginTop: 10,
    },
});
