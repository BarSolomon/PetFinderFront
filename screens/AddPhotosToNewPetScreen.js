import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Image, TouchableOpacity, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system'; // הוספת יבוא עבור FileSystem
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomButton from '../styleCustom/CustomButton';

const AddPhotosToNewPetScreen = () => {
  const [imageUris, setImageUris] = useState([]); // שינוי המצב לתמונות רבות
  const route = useRoute();
  const navigation = useNavigation();
  const { petId } = route.params;

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload images.');
      }
    };

    requestPermissions();
  }, []);

  const handleChooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      //allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true, // אפשרות לבחור מספר תמונות
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = await Promise.all(
        result.assets.map(async (asset) => {
          const compressedImage = await compressImage(asset.uri);
          return compressedImage.uri;
        })
      );
      setImageUris(uris); // עדכון ה-state עם התמונות שנבחרו
    } else {
      console.error('No images selected or result.canceled is true');
    }
  };

  const compressImage = async (uri) => {
    try {
      const { uri: newUri } = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // שינוי רוחב התמונות אם יש צורך
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // התאמת איכות הדחיסה
      );
      return { uri: newUri };
    } catch (error) {
      console.error('Error compressing image:', error);
      return { uri }; // החזרת URI המקורי במקרה של שגיאה
    }
  };

  const handleUploadImage = async () => {
    if (imageUris.length === 0) {
      console.error('No images selected');
      return;
    }
  
    try {
      const formData = new FormData();
      imageUris.forEach((uri, index) => {
        formData.append('files', {
          uri,
          name: `pet_${index}.jpg`, // שמות קבצים שונים לכל תמונה
          type: 'image/jpeg',
        });
      });
      formData.append('petId', petId);
  
      const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/photos/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        const { urls, filenames } = data; // שים לב לשם המאפיינים שה-API שלך מחזיר
  
        // הורדת התמונות ושמירה מקומית
        await Promise.all(
          urls.map(async (url, index) => {
            const downloadResponse = await FileSystem.downloadAsync(url, `${FileSystem.documentDirectory}${filenames[index]}`);
            return downloadResponse.uri;
          })
        );
  
        // עדכון פרטי החיה בזיכרון המקומי
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.map(pet => {
            if (pet._id === petId) {
              return {
                ...pet,
                localImageUris: [...(pet.localImageUris || []), ...filenames.map(filename => `${FileSystem.documentDirectory}${filename}`)],
              };
            }
            return pet;
          });
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
        }
  
        console.log('Images uploaded and saved locally');
        navigation.navigate('Home', { refresh: true });
      } else {
        console.error('Failed to upload images');
        navigation.navigate('Home', { refresh: true });
      }
    } catch (error) {
      console.error('Error:', error);
      navigation.navigate('Home', { refresh: true });
    }
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleChooseImage}>
        <Text style={styles.buttonText}>Choose Images</Text>
      </TouchableOpacity>

      <View style={styles.imagesContainer}>
        {imageUris.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </View>

      <CustomButton title="Upload Images" onPress={handleUploadImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: 'blue',
    marginBottom: 16,
    textAlign: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
});

export default AddPhotosToNewPetScreen;
