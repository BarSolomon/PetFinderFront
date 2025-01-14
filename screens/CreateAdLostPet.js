import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../context/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import CustomTextInput from '../styleCustom/CustomTextInput';
import CustomButton from '../styleCustom/CustomButton';
import CustomText from '../styleCustom/CustomText';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
]);

const CreateAdLostPet = () => {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [photoId, setPhotoId] = useState('');
  const [adContent, setAdContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLastAd, setLoadingLastAd] = useState(false);
  const [selectedPetName, setSelectedPetName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPetImageUri, setSelectedPetImageUri] = useState('');
  const [showAdContent, setShowAdContent] = useState(false); // State to control visibility
  const { userId, userEmail } = useUser();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/pets/user/${userId}/AllpetsById`);
        const data = await response.json();
        setPets(data);
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };

    fetchPets();
  }, [userId]);

  const handlePetSelection = async (petId) => {
    setSelectedPetId(petId);
    const selectedPet = pets.find(pet => pet._id === petId);
    setSelectedPetName(selectedPet ? selectedPet.name : '');

    if (selectedPet && selectedPet.photos.length > 0) {
      const photo = selectedPet.photos[0];
      setPhotoId(photo._id);
      const imageResponse = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/photos/${photo}/download`);
      const imageBlob = await imageResponse.blob();
      const imageUri = URL.createObjectURL(imageBlob);
      setSelectedPetImageUri(imageUri);
    } else {
      setSelectedPetImageUri('');
    }
  };

  const analyzePhoto = async () => {
    try {
      if (!selectedPetId) return;

      setLoading(true);

      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/photos/${selectedPetId}/photos`);
      const data = await response.json();

      if (data.length > 0) {
        setPhotoId(data[0]._id);
        const analysisResponse = await fetch('https://express-server-kflw7id5la-as.a.run.app/api/gpt/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: data[0].filename,
            prompt: `Given the photo of a lost pet named ${selectedPetName} belonging to ${userEmail}, please write an ad for the lost pet. The ad should be no more than 4 lines and include a big title.`,
          }),
        });

        const analysisData = await analysisResponse.json();
        setAdContent(analysisData.analysis);
        setShowAdContent(true); // Show ad content component
      } else {
        setPhotoId('');
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const printAd = async () => {
    const html = `
      <h1>Lost Pet Ad</h1>
      <p>${adContent}</p>
      <img src="${selectedPetImageUri}" style="width:100px; height:100px;"/>
    `;
    try {
      await Print.printAsync({ html });
      resetState();
    } catch (error) {
      console.error('Error printing ad:', error);
    }
  };

  const shareAd = async () => {
    try {
      if (!adContent) throw new Error('No content to share');

      const html = `
        <h1>Lost Pet Ad</h1>
        <p>${adContent}</p>
        <img src="${selectedPetImageUri}" style="width:100px; height:100px;"/>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing ad:', error);
    }
  };

  const handleContinue = async () => {
    if (!selectedPetId) return;
    await analyzePhoto();
  };

  const handleLastAdCreated = async () => {
    if (!selectedPetId) return;

    setLoadingLastAd(true);

    try {
      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/gpt/interaction?petId=${selectedPetId}`);
      const data = await response.json();

      if (data && data.response) {
        setAdContent(data.response);
        setShowAdContent(true); // Show ad content component
      } else {
        console.error('No response found for this pet');
      }
    } catch (error) {
      console.error('Error fetching last ad:', error);
    } finally {
      setLoadingLastAd(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      handleSave();
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`https://express-server-kflw7id5la-as.a.run.app/api/gpt/interaction?petId=${selectedPetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: adContent,
        }),
      });

      await response.json();
    } catch (error) {
      console.error('Error saving ad:', error);
    }
  };

  const resetState = () => {
    setSelectedPetId(null);
    setPhotoId('');
    setAdContent('');
    setSelectedPetName('');
    setSelectedPetImageUri('');
    setShowAdContent(false); // Hide ad content component
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }} // Allows the scroll view to take full height
      resetScrollToCoords={{ x: 0, y: 0 }}
      scrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.sectionContainer}>
        <CustomText style={styles.title}>Create Lost Pet Ad</CustomText>
      </View>

      {!showAdContent && (
        <>
          {/* Picker Component */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPetId}
              onValueChange={(itemValue) => handlePetSelection(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a pet" value={null} />
              {pets.map((pet) => (
                <Picker.Item key={pet._id} label={pet.name} value={pet._id} />
              ))}
            </Picker>
          </View>

          {/* Buttons Component */}
          <View style={styles.sectionContainer}>
            <CustomButton
              title="Create Ad"
              onPress={handleContinue}
              style={styles.continueButton}
            />
            <CustomButton
              title="Last Ad Created"
              onPress={handleLastAdCreated}
              style={styles.lastAdButton}
            />
            {/* Loading spinner under buttons */}
            {(loading || loadingLastAd) && <ActivityIndicator size="large" color="#0000ff" />}
          </View>
        </>
      )}

      {/* Ad Content Component - Visible after "Create Ad" or "Last Ad Created" */}
      {showAdContent && (
        <View style={styles.sectionContainer}>
          {selectedPetImageUri && (
            <Image
              source={{ uri: selectedPetImageUri }}
              style={styles.image}
            />
          )}
          <TextInput
            value={adContent}
            onChangeText={setAdContent}
            multiline
            style={styles.textArea}
            editable={isEditing}
          />
          <CustomButton
            title={isEditing ? "Save" : "Edit"}
            onPress={toggleEditMode}
            style={styles.toggleButton}
          />
          <View style={styles.buttonRow}>
            <CustomButton
              title="Share"
              onPress={shareAd}
              style={styles.smallButton}
            />
            <CustomButton
              title="Print"
              onPress={printAd}
              style={styles.smallButton}
            />
          </View>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 20, // Rounded corners
    shadowColor: '#000', // Shadow properties for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Shadow properties for Android
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    width: 350, // Set a specific width for the container
    height: 200, // Set a specific height for the container
    justifyContent: 'flex-start', // Align the picker at the top
    marginBottom: 16,
    borderRadius: 20, // Rounded corners
    shadowColor: '#000', // Shadow properties for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Shadow properties for Android
  },
  picker: {
    height: 50,
    marginTop: -10,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  continueButton: {
    marginBottom: 10,
  },
  lastAdButton: {
    marginBottom: 10,
  },
  toggleButton: {
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 8, // Smaller padding for the button
    paddingHorizontal: 12, // Smaller padding for the button
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 20,
    borderRadius: 10, // Rounded corners for image
  },
  textArea: {
    height: 200,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10, // Rounded corners for text area
    backgroundColor: '#fff', // Background color for text area
  },
});

export default CreateAdLostPet;
