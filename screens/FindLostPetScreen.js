import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, Alert, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import BottomNavBar from '../components/BottomNavBar';
import CustomButton from '../styleCustom/CustomButton';
import CustomText from '../styleCustom/CustomText';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// Component for displaying matched pet information
const PetMatchItem = ({ pet, owner }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.itemText}>Name: {pet.name}</Text>
        <Text style={styles.itemText}>Age: {pet.age}</Text>
        <Text style={styles.itemText}>Gender: {pet.gender}</Text>
        <Text style={styles.itemText}>Owner: {owner.name}</Text>
        <Text style={styles.itemText}>Phone: {owner.phone}</Text>
        <Text style={styles.itemText}>Email: {owner.email}</Text>
      </View>
      <Image
        source={{ uri: `https://express-server-kflw7id5la-as.a.run.app/api/photos/${pet.photos[0]}/download` }}
        style={styles.image}
      />
    </View>
  );
};

// Component for the top image
const TopImageComponent = () => (
  <View style={styles.topImageContainer}>
    <Image
      source={require('../assets/FindLostPet_icon.png')} // Load local image from the assets folder
      style={styles.topImage}
    />
  </View>
);

// Component for buttons and the image
const ButtonsAndImageComponent = ({ image, pickImage, findMatches, loading }) => (
  <View style={styles.buttonsAndImageContainer}>
    <CustomButton title="Take a Picture" onPress={pickImage} />
    <Image
      source={image ? { uri: image } : require('../assets/no_photo.jpg')} // Display default image if no image selected
      style={styles.lostDogImage}
    />
    {image && ( // Show "Find Matches" button only if an image is selected
      <CustomButton title="Find Matches" onPress={findMatches} />
    )}
    {loading && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )}
  </View>
);

// Component to display the list of matches
const MatchesListComponent = ({ matches }) => (
  <View style={styles.matchesListContainer}>
    {matches.length > 0 && (
      <>
        <CustomText>The Best Matches:</CustomText>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.pet._id}
          renderItem={({ item }) => (
            <PetMatchItem pet={item.pet} owner={item.owner} />
          )}
          style={styles.matchesList}
        />
      </>
    )}
  </View>
);

export default function FindLostPetScreen() {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const { userEmail } = useUser();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation(); // Initialize navigation object

  const pickImage = async () => {
    console.log('Requesting camera permissions...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('Camera permission status:', status);

    if (status !== 'granted') {
      Alert.alert('Error', 'Camera permission is required!');
      return;
    }

    console.log('Launching camera...');
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log('Image Picker Result:', result);

    if (!result.canceled) {
      const imageUri = result.assets && result.assets.length > 0 ? result.assets[0].uri : null;
      setImage(imageUri);
      console.log('Selected Image URI:', imageUri);
      await getLocation();
    } else {
      console.log('Image picking was canceled');
    }
  };

  const getLocation = async () => {
    console.log('Requesting location permissions...');
    let { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);

    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    console.log('Fetching location...');
    let { coords } = await Location.getCurrentPositionAsync({});
    setLocation(coords);
    console.log('Location:', coords);
  };

  const findMatches = async () => {
    console.log('findMatches function called');

    if (!image || !location) {
      Alert.alert('Error', 'Please make sure to capture an image and obtain location.');
      console.log('Missing image or location');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Step 1: Create a new pet
      console.log('Creating new pet with data:', {
        name: 'lost Pet',
        ownerEmail: userEmail,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        isPetMine: false,
        isLost: true,
      });

      const petResponse = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/pets/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'lost Pet',
          ownerEmail: userEmail,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          isPetMine: false,
          isLost: true,
        }),
      });

      const petData = await petResponse.json();
      console.log('Created Pet Response:', petData);

      const petId = petData.pet._id;
      console.log('Created Pet ID:', petId);

      // Step 2: Upload the image
      if (petId && image) {
        console.log('Uploading image with data:', {
          uri: image,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });

        const formData = new FormData();
        formData.append('files', {
          uri: image,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
        formData.append('petId', petId);

        const uploadResponse = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        console.log('Upload Result:', uploadResult);

        // Step 3: Find Matches
        try {
          console.log("try to do match");
          const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/pets/findMatch/${petId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log("match is done");
          const data = await response.json();
          console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", data);
          console.log(response);

          if (response.ok) {
            console.log("Match analysis complete:", data);
            setMatches(data.matches); // Save the list of matches in state
            const newPet = data.newPet; // Assuming there is this data
            //navigation.navigate('Home', { refresh: false }); // Navigate to Home
            navigation.emit({ type: 'addPet', data: newPet }); // Emit the event to add pet
          } else {
            console.error('Error finding matches:', data.message);
          }
        } catch (error) {
          console.error('Error in findMatchForPet:', error);
        }

      } else {
        Alert.alert('Error', 'Could not create pet or image is missing.');
      }
    } catch (error) {
      console.error('Error during find matches:', error);
      Alert.alert('Error', 'An error occurred while finding matches.');
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { flexGrow: 1, paddingBottom: 100 }]}>
        <TopImageComponent />
        <ButtonsAndImageComponent
          image={image}
          pickImage={pickImage}
          findMatches={findMatches}
          loading={loading}
        />
        <MatchesListComponent matches={matches} />
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  topImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  topImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 40, 
  },
  buttonsAndImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 40,  // Rounded corners
  },
  lostDogImage: {
    width: 200,
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
  },
  matchesListContainer: {
    marginTop: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  itemText: {
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
