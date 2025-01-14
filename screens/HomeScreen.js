import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import BottomNavBar from '../components/BottomNavBar';
import { useUser } from '../context/UserContext';
import CustomText from '../styleCustom/CustomText';

import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
]);

// Colors for pet cards
const colors = ['#FFBE98', '#F7DED0', '#E2BFB3'];

const PetListSection = ({ title, pets, onPetPress, onAddPress }) => (
  <View style={styles.sectionContainer}>
    <View style={styles.header}>
      <CustomText style={styles.title}>{title}</CustomText>
      <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
    <FlatList
      data={pets}
      renderItem={onPetPress}
      keyExtractor={(item) => item._id}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>No pets found</Text>}
    />
  </View>
);

const HomeScreen = () => {
  const { userId, userName, userEmoji, setUserEmoji } = useUser();
  const [pets, setPets] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const navigation = useNavigation();

  // Image mapping
  const imageMap = {
    '1': require('../assets/icon_woman_brownhair.jpeg'),
    '2': require('../assets/icon_woman_brown_skin.jpeg'),
    '3': require('../assets/default_image.jpeg'),
    '4': require('../assets/icon_man_long_hair.jpeg'),
    '5': require('../assets/icon_blonde_woman.jpeg'),
    '6': require('../assets/black_man_icon.jpeg'),
  };

  const userImage = imageMap[userEmoji] || require('../assets/default_image.jpeg');

  useFocusEffect(
    useCallback(() => {
      const loadLocalPets = async () => {
        const localPets = await AsyncStorage.getItem('pets');
        if (localPets) {
          const petsFromStorage = JSON.parse(localPets);
          setPets(petsFromStorage);  // Load pets from local storage first
        } else {
          // Fetch pets from server if not found locally
          await fetchPetsFromServer();
        }
      };

      loadLocalPets();
    }, [userId])
  );

  // Add this useFocusEffect to reload photos when coming back from AddPhotosToNewPetScreen
  useFocusEffect(
    useCallback(() => {
      if (pets.length > 0) {
        downloadAllPhotos(pets); // Call function to download all photos
      }
    }, [pets])
  );

  const fetchPetsFromServer = async () => {
    try {
      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/pets/user/${userId}/AllpetsById`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pets: ${response.statusText}`);
      }
      const data = await response.json();
      const petsWithNewImages = await downloadAllPhotos(data);
      setPets(petsWithNewImages);
      await savePetsLocally(petsWithNewImages); // Save updated pets with images to AsyncStorage
    } catch (error) {
      console.error('Error fetching or updating pets:', error);
      Alert.alert('Error', 'Failed to fetch pets from server.');
    }
  };

  const handlePetDeleted = (deletedPetId) => {
    const updatedPets = pets.filter(pet => pet._id !== deletedPetId);
    setPets(updatedPets);
    savePetsLocally(updatedPets);  // Update local storage
  };

  const handlePetAdded = (newPet) => {
    const updatedPets = [...pets, newPet];
    setPets(updatedPets);
    savePetsLocally(updatedPets);  // Update local storage
  };

  const downloadAllPhotos = async (pets) => {
    try {
      const updatedPets = [...pets];

      for (const pet of pets) {
        // Check if image exists locally
        const localUri = pet.localImageUris?.[0];
        if (localUri && await FileSystem.getInfoAsync(localUri).then(info => info.exists)) {
          console.log(`Image for pet ${pet._id} already exists locally, using cached version.`);
          setLoadedImages(prev => ({ ...prev, [pet._id]: true }));  // Mark image as loaded
          continue;
        }

        try {
          const metadataResponse = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/${pet._id}/photos`);
          if (!metadataResponse.ok) {
            throw new Error(`Failed to fetch photo metadata for pet ${pet._id}: ${metadataResponse.statusText}`);
          }
          const photoData = await metadataResponse.json();

          const urlsResponse = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/generate-urls/${pet._id}`);
          if (!urlsResponse.ok) {
            throw new Error(`Failed to fetch image URLs for pet ${pet._id}: ${urlsResponse.statusText}`);
          }
          const { image_urls } = await urlsResponse.json();

          if (image_urls.length > 0) {
            const firstImageUrl = image_urls[0];
            const filename = photoData[0]?.filename;
            const newLocalUri = `${FileSystem.documentDirectory}${filename}`;

            const downloadResumable = FileSystem.createDownloadResumable(firstImageUrl, newLocalUri);
            await downloadResumable.downloadAsync();

            pet.localImageUris = [newLocalUri];  // Add new local URI to pet data
            updatedPets.find(p => p._id === pet._id).localImageUris = [newLocalUri];
            setLoadedImages(prev => ({ ...prev, [pet._id]: true }));  // Mark image as loaded
          }
        } catch (error) {
         // console.error(`Error downloading photos for pet ${pet._id}:`, error);
        }
      }

      return updatedPets;
    } catch (error) {
     // console.error('Error downloading all photos:', error);
    }
  };

  const handlePetPress = (petId) => {
    const pet = pets.find(p => p._id === petId);

    if (!pet) {
      console.error('Pet not found in local storage');
      Alert.alert('Error', 'Pet not found in local storage');
      return;
    }

    if (pet.isPetMine) {
      navigation.navigate('PetDetails', { petId, onDelete: handlePetDeleted });
    } else {
      navigation.navigate('LostPetDetails', { petId, onDelete: handlePetDeleted });
    }
  };

  const savePetsLocally = async (pets) => {
    try {
      const petsWithImages = pets.map(pet => ({
        ...pet,
        localImageUris: pet.localImageUris || [],
      }));
      await AsyncStorage.setItem('pets', JSON.stringify(petsWithImages));
    } catch (error) {
      console.error('Error saving pets to local storage:', error);
    }
  };

  const renderPetItem = ({ item, index }) => {
    const backgroundColor = colors[index % colors.length];

    return (
      <TouchableOpacity onPress={() => handlePetPress(item._id)}>
        <View style={[styles.petCard, { backgroundColor }]}>
          <Image source={{ uri: item.localImageUris?.[0] || '1' }} style={styles.petImage} />
          <View style={styles.petDetails}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petType}>{item.type}</Text>
            <Text style={[styles.petStatus, item.isLost ? styles.lost : styles.notLost]}>
              {item.isLost ? 'Lost' : 'Not Lost'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const TopImageComponent = () => (
    <View style={styles.topImageContainer}>
      <Image
        source={require('../assets/PetFinderHomeScreenIcon.png')} // Load local image from the assets folder
        style={styles.topImage}
      />
    </View>
  );

  const handleAddPet = () => {
    navigation.navigate('CreatePet', { onAdd: handlePetAdded });
  };

  const handleFindLostPet = () => {
    navigation.navigate('FindLostPet', { onAdd: handlePetAdded });
  };

  const myPets = pets.filter(pet => pet.isPetMine);
  const foundPets = pets.filter(pet => !pet.isPetMine);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.topContainer}>
          <Image source={userImage} style={styles.userImage} />
          <Text style={styles.welcomeText}>Welcome back {userName}</Text>
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Icon name="settings-outline" size={30} color="#333" />
          </TouchableOpacity>
        </View>
        <PetListSection title="My Pets" pets={myPets} onPetPress={renderPetItem} onAddPress={handleAddPet} />
        <PetListSection title="Pets I Found" pets={foundPets} onPetPress={renderPetItem} onAddPress={handleFindLostPet} />
      </ScrollView>
      <BottomNavBar style={styles.bottomNavBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    borderRadius: 40,
  },
  userImage: {
    width: 70,
    height: 70,
    borderRadius: 25,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'tenor-sans',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'tenor-sans',
  },
  addButton: {
    backgroundColor: '#ECCA9C',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  listContainer: {
    paddingBottom: 70,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    width: 173,
    marginBottom: 16,
    marginHorizontal: '1%',
    height: 120,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontFamily: 'tenor-sans',
    fontWeight: 'bold',
  },
  petType: {
    fontSize: 14,
    fontFamily: 'tenor-sans',
    color: '#666',
  },
  petStatus: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'tenor-sans',
  },
  lost: {
    color: 'red',
  },
  notLost: {
    color: 'green',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default HomeScreen;
