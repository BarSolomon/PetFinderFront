import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Image, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../styleCustom/CustomButton';
import CustomTextInput from '../styleCustom/CustomTextInput';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext';

const PetDetailsScreen = () => {
  const [pet, setPet] = useState(null);
  const [editable, setEditable] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [type, setType] = useState('');
  const [gender, setGender] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLost, setIsLost] = useState(false); // Track lost status
  const route = useRoute();
  const { petId } = route.params;
  const navigation = useNavigation();
  const { userId } = useUser(); // Retrieve userId from UserContext

  useEffect(() => {
    const fetchLocalPetDetails = async () => {
      try {
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const foundPet = pets.find(pet => pet._id === petId);
          if (foundPet) {
            setPet(foundPet);
            setName(foundPet.name);
            setAge(foundPet.age.toString());
            setBreed(foundPet.breed);
            setType(foundPet.type);
            setGender(foundPet.gender);
            setDescription(foundPet.description);
            setImages(foundPet.images || []); // Load images from the pet object
            setIsLost(foundPet.isLost || false); // Initialize lost status
          } else {
            Alert.alert('Error', 'Pet not found in local storage');
          }
        } else {
          Alert.alert('Error', 'No pets found in local storage');
        }
      } catch (error) {
        console.error('Error fetching pet details from local storage:', error);
      }
    };

    fetchLocalPetDetails();
  }, [petId]);

  const handleEdit = () => {
    setEditable(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          breed,
          type,
          gender,
          description,
          isLost, // Update lost status
          city: pet.city,
        }),
      });

      if (response.ok) {
        const updatedPet = { ...pet, name, age: parseInt(age), breed, type, gender, description, images, isLost };
        
        // Update local storage
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.map(p => p._id === petId ? updatedPet : p);
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
        }

        Alert.alert(
          'Success',
          'Pet details updated successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setEditable(false);
      } else {
        Alert.alert('Error', 'Failed to update pet details');
      }
    } catch (error) {
      console.error('Error updating pet details:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/pets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          ownerId: userId, // Send the ownerId along with petId
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Pet deleted successfully', [
          { text: 'OK', onPress: async () => {
            // Remove the pet from local storage
            const localPets = await AsyncStorage.getItem('pets');
            if (localPets) {
              const pets = JSON.parse(localPets);
              const updatedPets = pets.filter(p => p._id !== petId);
              await AsyncStorage.setItem('pets', JSON.stringify(updatedPets)); 
            }
            //navigation.navigate('Home', { petDeleted: true }); // Pass a parameter back to HomeScreen
            navigation.navigate('Home', { refresh: true });
          } },
        ]);
      } else {
        Alert.alert('Error', 'Failed to delete pet');
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const handleWhatIsMyRoots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/pets/classify/${petId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      console.log(text);

      const data = text ? JSON.parse(text) : null;

      if (data && data.breedPrediction && data.breedPrediction.predictions.length > 0) {
        let bestBreed = data.breedPrediction.predictions[0].breed;
        console.log(`The root breed of your pet is: ${bestBreed}`);
        Alert.alert('Root Breed', `The root breed of your pet is: ${bestBreed}`);
      } else {
        Alert.alert('Info', 'No breed prediction available');
      }
    } catch (error) {
      console.error('Error fetching breed prediction:', error);
      Alert.alert('Error', 'Failed to fetch breed prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Allow multiple image selection
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || 'pet.jpg',
        type: asset.type,
      }));

      console.log('Selected images:', newImages); // Debug selected images
      setImages([...images, ...newImages]);
    } else {
      console.error('No images selected or result.canceled is true');
    }
  };

  const handleUploadImages = async () => {
    if (images.length === 0) {
      console.error('No images selected');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('files', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        });
      });
      formData.append('petId', petId);

      const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Images uploaded successfully');
        // Optionally, update the pet object with new images from response
        setImages([...images]); // Update local state if necessary
      } else {
        console.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUri) => {
    try {
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/photos/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId: imageUri, // Assuming imageUri is the photoId for simplicity
        }),
      });

      if (response.ok) {
        // Remove from local state
        const updatedImages = images.filter(image => image.uri !== imageUri);
        setImages(updatedImages);
        console.log('Image deleted successfully');
      } else {
        console.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleToggleLostStatus = async () => {
    try {
      const newStatus = !isLost;
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/${petId}/updateLostStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isLost: newStatus,
        }),
      });

      if (response.ok) {
        const updatedPet = { ...pet, isLost: newStatus };
        
        // Update local storage
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.map(p => p._id === petId ? updatedPet : p);
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
          navigation.navigate('Home', { refresh: true });
        }

        setPet(updatedPet);
        setIsLost(newStatus);
        Alert.alert(
          'Success',
          `Pet status updated to ${newStatus ? 'Lost' : 'Found'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to update pet status');
      }
    } catch (error) {
      console.error('Error updating pet status:', error);
    }
  };

  if (!pet) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.content}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={editable}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              editable={editable}
              placeholder="Age"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              editable={editable}
              placeholder="Breed"
            />
            <TextInput
              style={styles.input}
              value={type}
              onChangeText={setType}
              editable={editable}
              placeholder="Type"
            />
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
              editable={editable}
              placeholder="Gender"
            />
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              editable={editable}
              placeholder="Description"
            />

            <View style={styles.imagesContainer}>
              <FlatList
                data={images}
                keyExtractor={(item, index) => item.uri + index}
                renderItem={({ item }) => (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.uri }} style={styles.image} />
                    {editable && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteImage(item.uri)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
              {editable && (
                <TouchableOpacity onPress={handleChooseImages} style={styles.chooseButton}>
                  <Text style={styles.chooseButtonText}>Choose Images</Text>
                </TouchableOpacity>
              )}
              {editable && (
                <TouchableOpacity onPress={handleUploadImages} style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload Images'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {!editable ? (
                <CustomButton title="Edit" onPress={handleEdit} />
              ) : (
                <Button title="Save" onPress={handleSave} />
              )}
              <Button title={isLost ? 'Mark as Found' : 'Mark as Lost'} onPress={handleToggleLostStatus} color={isLost ? 'red' : 'green'} />
              <Button title="Delete Pet" onPress={handleDelete} color="red" />
              <Button title="What is my roots?" onPress={handleWhatIsMyRoots} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  imagesContainer: {
    marginVertical: 10,
  },
  imageContainer: {
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  chooseButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  chooseButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  deleteButtonText: {
    color: '#fff',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default PetDetailsScreen;

