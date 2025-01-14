import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import CustomButton from '../styleCustom/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomText from '../styleCustom/CustomText';

const images = [
  { id: '1', source: require('../assets/icon_woman_brownhair.jpeg') },
  { id: '2', source: require('../assets/icon_woman_brown_skin.jpeg') },
  { id: '3', source: require('../assets/default_image.jpeg') },
  { id: '4', source: require('../assets/icon_man_long_hair.jpeg') },
  { id: '5', source: require('../assets/icon_blonde_woman.jpeg') },
  { id: '6', source: require('../assets/black_man_icon.jpeg') }
];

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { userEmoji, setUserEmoji, setUserID, setUserEmail } = useUser();  // שימוש ב-setUserID
  const [selectedImage, setSelectedImage] = useState(userEmoji);

  useEffect(() => {
    const loadSelectedEmoji = async () => {
      try {
        const savedEmoji = await AsyncStorage.getItem('userEmoji');
        if (savedEmoji) {
          setSelectedImage(savedEmoji);
        }
      } catch (error) {
        console.error('Error loading selected emoji:', error);
      }
    };

    loadSelectedEmoji();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'No',
          onPress: () => console.log('Logout Cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            setUserID(null);  // שימוש נכון בפונקציה setUserID
            setUserEmail(null);

            await AsyncStorage.clear();  // נקה את האחסון המקומי

            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleUpdateDetails = () => {
    navigation.navigate('UserDetails');
  };

  const handleChangePassword = () => {
    navigation.navigate('PasswordChange');
  };

  const handleImageSelect = async (id) => {
    setSelectedImage(id);
    setUserEmoji(id);
    console.log(id);
    
    try {
      await AsyncStorage.setItem('userEmoji', id);
    } catch (error) {
      console.error('Error saving emoji selection:', error);
    }
  };

  const renderImageItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleImageSelect(item.id)}
      style={styles.imageContainer}
    >
      <Image
        source={item.source}
        style={[
          styles.image,
          { borderColor: selectedImage === item.id ? 'blue' : 'transparent' }
        ]}
      />
    </TouchableOpacity>
  );

  const ImageSelectionComponent = () => (
    <View style={styles.sectionContainer}>
      <CustomText style={styles.title}>Choose Your Avatar</CustomText>
      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        numColumns={3} // 3 images per row
        contentContainerStyle={styles.imagesWrapper} // Style to center the images
      />
    </View>
  );

  const ButtonComponent = () => (
    <View style={styles.sectionContainer}>
      <CustomText style={styles.title}>Settings</CustomText>
      <CustomButton
        title="Update Details"
        onPress={handleUpdateDetails}
        color="#4CAF50"
        style={styles.button}
      />
      <CustomButton
        title="Change Password"
        onPress={handleChangePassword}
        color="#FF8C00"
        style={styles.button}
      />
      <CustomButton
        title="Logout"
        onPress={handleLogout}
        color="#FF6347"
        style={styles.button}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageSelectionComponent />
      <ButtonComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  imagesWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  image: {
    width: 70, // Increased width
    height: 70, // Increased height
    borderRadius: 35,
    borderWidth: 2,
  },
  button: {
    marginVertical: 10,
  },
});

export default SettingsScreen;
