import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Image, FlatList, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../styleCustom/CustomButton';
import CustomTextInput from '../styleCustom/CustomTextInput';
import { useUser } from '../context/UserContext';
import * as FileSystem from 'expo-file-system';

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
  const [isLost, setIsLost] = useState(false);
  const route = useRoute();
  const { petId, onDelete } = route.params;
  const navigation = useNavigation();
  const { userId } = useUser();

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
            setImages(foundPet.localImageUris || []);
            setIsLost(foundPet.isLost || false);
            await handleDownloadPhotos(petId);
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

  const handleDownloadPhotos = async (petId) => {
    try {
      const metadataResponse = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/${petId}/photos`);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch photo metadata for pet ${petId}: ${metadataResponse.statusText}`);
      }
      const photoData = await metadataResponse.json();

      const urlsResponse = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/generate-urls/${petId}`);
      if (!urlsResponse.ok) {
        throw new Error(`Failed to fetch image URLs for pet ${petId}: ${urlsResponse.statusText}`);
      }
      const { image_urls } = await urlsResponse.json();

      const localUris = [];
      for (let i = 0; i < image_urls.length; i++) {
        const imageUrl = image_urls[i];
        const filename = photoData[i]?.filename;
        if (filename) {
          const localUri = `${FileSystem.documentDirectory}${filename}`;
          localUris.push(localUri);
          const downloadResumable = FileSystem.createDownloadResumable(imageUrl, localUri);
          await downloadResumable.downloadAsync();
        }
      }

      setImages(localUris);
      console.log('Images downloaded and state updated:', localUris);
    } catch (error) {
      console.error(`Error downloading photos for pet ${petId}:`, error);
    }
  };

  const handleToggleLostStatus = async () => {
    try {
      const newLostStatus = !isLost; // Toggle the lost status
  
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/${petId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          breed,
          type,
          gender,
          description,
          isLost: newLostStatus,
          city: pet.city,
        }),
      });
  
      if (response.ok) {
        setIsLost(newLostStatus);
        
        // Update local storage with new status
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.map(p => (p._id === petId ? { ...p, isLost: newLostStatus } : p));
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
        }
  
        Alert.alert('Success', `Pet marked as ${newLostStatus ? 'Lost' : 'Not Lost'} successfully`);
      } else {
        Alert.alert('Error', 'Failed to update pet status');
      }
    } catch (error) {
      console.error('Error updating pet status:', error);
      Alert.alert('Error', 'Failed to update pet status');
    }
  };

  const handleEdit = () => setEditable(true);

  const handleSave = async () => {
    try {
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/${petId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          breed,
          type,
          gender,
          description,
          isLost,
          city: pet.city,
        }),
      });

      if (response.ok) {
        const updatedPet = { ...pet, name, age: parseInt(age), breed, type, gender, description, images, isLost };
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.map(p => (p._id === petId ? updatedPet : p));
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
        }

        Alert.alert('Success', 'Pet details updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, ownerId: userId }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Pet deleted successfully', [
          {
            text: 'OK',
            onPress: async () => {
              const localPets = await AsyncStorage.getItem('pets');
              if (localPets) {
                const pets = JSON.parse(localPets);
                const updatedPets = pets.filter(p => p._id !== petId);
                await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
              }
              if (onDelete) onDelete(petId);
              navigation.navigate('Home', { refresh: true });
            },
          },
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
      const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/breed-prediction?petId=${petId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const text = await response.text();
      console.log(text);
      const data = text ? JSON.parse(text) : null;

      if (data && data.predictions.length > 0) {
        let bestBreed = data.predictions[0].breed;
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

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <PetDetailsComponent
          pet={pet}
          name={name}
          setName={setName}
          age={age}
          setAge={setAge}
          breed={breed}
          setBreed={setBreed}
          type={type}
          setType={setType}
          gender={gender}
          setGender={setGender}
          description={description}
          setDescription={setDescription}
          images={images}
          isLost={isLost}
          editable={editable}
          setEditable={setEditable}
          handleSave={handleSave}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleWhatIsMyRoots={handleWhatIsMyRoots}
          handleToggleLostStatus={handleToggleLostStatus}
          loading={loading}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const PetDetailsComponent = ({ pet, name, setName, age, setAge, breed, setBreed, type, setType, gender, setGender, description, setDescription, images, isLost, editable, setEditable, handleSave, handleEdit, handleDelete, handleWhatIsMyRoots, handleToggleLostStatus, loading }) => (
  <View style={styles.detailCard}>
    {/* Title Component */}
    <Text style={styles.title}>{name}</Text>

    {/* Image List Component */}
    <FlatList
      data={images}
      renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
      keyExtractor={(item) => item}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.imageList}
    />

    {/* Details Component */}
    <View style={styles.detailsContainer}>
      <CustomTextInput label="Name" value={name} onChangeText={setName} editable={editable} />
      <CustomTextInput label="Age" value={age} onChangeText={setAge} editable={editable} keyboardType="numeric" />
      <CustomTextInput label="Breed" value={breed} onChangeText={setBreed} editable={editable} />
      <CustomTextInput label="Type" value={type} onChangeText={setType} editable={editable} />
      <CustomTextInput label="Gender" value={gender} onChangeText={setGender} editable={editable} />
      <CustomTextInput label="Description" value={description} onChangeText={setDescription} editable={editable} />
      <View style={styles.statusContainer}>
        <Text>Status: {isLost ? 'Lost' : 'Not Lost'}</Text>
      </View>

      {/* Buttons Component */}
      <View style={styles.buttonContainer}>
        {editable ? (
          <CustomButton onPress={handleSave} title="Save" />
        ) : (
          <CustomButton onPress={handleEdit} title="Edit" />
        )}
        {!editable && <CustomButton onPress={handleDelete} title="Delete Pet" color="red" />}
        {!editable && <CustomButton onPress={handleWhatIsMyRoots} title="What Is My Roots?" />}
        {!editable && (
          <CustomButton
            onPress={handleToggleLostStatus}
            title={isLost ? 'Mark as Found' : 'Mark as Lost'}
            color={isLost ? 'green' : 'orange'}
          />
        )}
      </View>
    </View>
    {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageList: {
    marginVertical: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default PetDetailsScreen;
