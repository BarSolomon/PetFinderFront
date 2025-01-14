// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Print from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CreatePetScreen from './screens/CreatePetScreen';
import AddPhotosToNewPetScreen from './screens/AddPhotosToNewPetScreen';
import PetDetailsScreen from './screens/PetDetailsScreen';
import UserDetailsScreen from './screens/UserDetailsScreen';
import FindLostPetScreen from './screens/FindLostPetScreen';
import CreateAdLostPet from './screens/CreateAdLostPet';
import SettingsScreen from './screens/SettingsScreen';
import FindMyRootsScreen from './screens/FindMyRootsScreen';
import SignUpScreen from './screens/SignUpScreen';
import { UserProvider } from './context/UserContext'; // ייבוא ה-UserProvider 
import PasswordChangeScreen from './screens/PasswordChangeScreen';
import LostPetDetailsScreen from './screens/LostPetDetailsScreen';


const Stack = createNativeStackNavigator();


export default function App() {
  
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreatePet" component={CreatePetScreen} />
          <Stack.Screen name="AddPhotosToNewPet" component={AddPhotosToNewPetScreen} />
          <Stack.Screen name="CreateAdLostPet" component={CreateAdLostPet} />
          <Stack.Screen name="PetDetails" component={PetDetailsScreen} />
          <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
          <Stack.Screen name="FindLostPet" component={FindLostPetScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="FindMyRoots" component={FindMyRootsScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
          <Stack.Screen name="LostPetDetails" component={LostPetDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
