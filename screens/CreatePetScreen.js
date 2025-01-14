import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import CustomButton from '../styleCustom/CustomButton';
import CustomTextInput from '../styleCustom/CustomTextInput';
import CustomText from '../styleCustom/CustomText';

const CreatePetScreen = () => {
  const { userEmail } = useUser();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [type, setType] = useState('Dog');
  const [gender, setGender] = useState('Male');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const navigation = useNavigation();

  const handleCreatePet = async () => {
    try {
      const response = await fetch('https://express-app-kflw7id5la-as.a.run.app/api/pets/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          age,
          breed,
          type,
          gender,
          description,
          isLost: false,
          city,
          ownerEmail: userEmail,
          fullAddress: city,
        }),
      });

      if (response.status === 201) {
        const data = await response.json();
        const petId = data.pet._id;

        try {
          const response = await fetch(`https://express-app-kflw7id5la-as.a.run.app/api/pets/breed-prediction?petId=${petId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error fetching breed prediction:', error);
        }

        if (petId) {
          // Save pet locally
          const localPets = await AsyncStorage.getItem('pets');
          const pets = localPets ? JSON.parse(localPets) : [];
          const newPet = {
            ...data.pet,
            localImageUri: null, // No images initially
          };
          await AsyncStorage.setItem('pets', JSON.stringify([...pets, newPet]));

          // Navigate to AddPhotosToNewPetScreen with the petId
          navigation.navigate('AddPhotosToNewPet', { petId });
        } else {
          console.error('Received empty petId');
        }
      } else {
        console.error('Failed to create pet', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <CustomText style={styles.title}>Create Pet</CustomText>

        <Text style={styles.label}>Name:</Text>
        <CustomTextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Age:</Text>
        <CustomTextInput
          value={age}
          onChangeText={setAge}
          keyboardType='numeric'
          style={styles.input}
        />

        <Text style={styles.label}>Breed:</Text>
        <CustomTextInput
          value={breed}
          onChangeText={setBreed}
          style={styles.input}
        />

        <Text style={styles.label}>Type:</Text>
        <CustomTextInput
          value={type}
          onChangeText={setType}
          style={styles.input}
        />

        <Text style={styles.label}>Gender:</Text>
        <CustomTextInput
          value={gender}
          onChangeText={setGender}
          style={styles.input}
        />

        <Text style={styles.label}>Description:</Text>
        <CustomTextInput
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />

        <Text style={styles.label}>City:</Text>
        <CustomTextInput
          value={city}
          onChangeText={setCity}
          style={styles.input}
        />

        <CustomButton title="Create Pet" onPress={handleCreatePet} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});

export default CreatePetScreen;
