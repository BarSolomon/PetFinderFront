import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../styleCustom/CustomButton';
import { useUser } from '../context/UserContext';
import MapView, { Marker } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';

const LostPetDetailsScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [petDetails, setPetDetails] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // Handle image URL
  const [location, setLocation] = useState(null); // Handle location
  const [loading, setLoading] = useState(false); // Loading state
  const { userId: ownerId } = useUser();

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const pet = pets.find(p => p._id === petId);
          if (pet) {
            setPetDetails(pet);
            await fetchImageUrl(pet._id, pet.localImageUris); // Fetch image URL
            await fetchPetLocation(pet._id); // Fetch pet location
          } else {
            Alert.alert('Error', 'Pet details not found');
          }
        } else {
          Alert.alert('Error', 'No pets found in local storage');
        }
      } catch (error) {
        console.error('Error fetching pet details:', error);
        Alert.alert('Error', 'Failed to load pet details');
      }
    };

    fetchPetDetails();
  }, [petId]);

  const fetchImageUrl = async (petId, localImageUris) => {
    if (localImageUris && localImageUris.length > 0) {
      // Use local image URI if available
      setImageUrl(localImageUris[0]);
      console.log('Using local image URL:', localImageUris[0]);
    } else {
      try {
        const urlsResponse = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/generate-urls/${petId}`);
        if (!urlsResponse.ok) {
          throw new Error(`Failed to fetch image URLs for pet ${petId}: ${urlsResponse.statusText}`);
        }
        const { image_urls } = await urlsResponse.json();

        if (image_urls.length > 0) {
          // Download the image and save locally
          const firstImageUrl = image_urls[0];
          const filename = firstImageUrl.split('/').pop(); // Extract filename from URL
          const localUri = `${FileSystem.documentDirectory}${filename}`;

          const downloadResumable = FileSystem.createDownloadResumable(firstImageUrl, localUri);
          await downloadResumable.downloadAsync();

          // Save the downloaded image locally and update the pet details
          setImageUrl(localUri);
          console.log('Image URL fetched and saved locally:', localUri);

          // Update local storage
          const localPets = await AsyncStorage.getItem('pets');
          if (localPets) {
            const pets = JSON.parse(localPets);
            const updatedPets = pets.map(p =>
              p._id === petId ? { ...p, localImageUris: [localUri] } : p
            );
            await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
          }
        }
      } catch (error) {
        console.error('Error fetching image URL:', error);
      }
    }
  };

  const fetchPetLocation = async (petId) => {
    try {
      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/pets/coordinates/${petId}`);

      if (!response.ok) {
        console.error('Error fetching pet location:', response.statusText);
        return;
      }

      const data = await response.json();

      if (data && data.coordinates) {
        const [longitude, latitude] = data.coordinates;

        setLocation({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        console.error('No coordinates found in the response:', data);
      }
    } catch (error) {
      console.error('Error fetching pet location:', error);
    }
  };

  const handleFoundOwner = async () => {
    setLoading(true); // Start loading
    console.log("handleFoundOwner function");
    try {
      const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/pets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId: petDetails._id,
          ownerId: ownerId,
        }),
      });

      if (response.ok) {
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const pets = JSON.parse(localPets);
          const updatedPets = pets.filter(p => p._id !== petId);
          await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
        }

        navigation.navigate('Home', { refresh: true });
      } else {
        Alert.alert('Error', 'Failed to delete pet from server');
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
      Alert.alert('Error', 'An error occurred while trying to delete the pet');
    } finally {
      setLoading(false); // End loading
    }
  };

  if (!petDetails) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <LostPetDetailsComponent
        petDetails={petDetails}
        imageUrl={imageUrl}
        location={location}
        onFoundOwner={handleFoundOwner}
        loading={loading} // Pass loading state to component
      />
    </ScrollView>
  );
};

// New Component for Lost Pet Details
const LostPetDetailsComponent = ({ petDetails, imageUrl, location, onFoundOwner, loading }) => {
  return (
    <View style={styles.detailCard}>
      <View style={styles.petDetailsContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Text>No image available</Text>
        )}
        <Text style={styles.title}>{petDetails.name}</Text>
        <Text>Breed: {petDetails.breed}</Text>
      </View>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={location}
        >
          <Marker
            coordinate={location}
            title={petDetails.name}
          />
        </MapView>
      )}

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" /> // Show loading indicator
        ) : (
          <CustomButton title="I Found the Owner" onPress={onFoundOwner} />
        )}
      </View>
    </View>
  );
};

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
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  petDetailsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 200,
    marginVertical: 20,
    borderRadius: 12,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});

export default LostPetDetailsScreen;
