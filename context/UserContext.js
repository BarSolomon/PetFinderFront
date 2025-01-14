// context/UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserID] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userEmoji, setUserEmoji] = useState('../assets/default_image.jpeg'); // אימוג'י ברירת מחדל

  useEffect(() => {
    const loadUserEmoji = async () => {
      if (userId) {
        try {
          const emoji = await AsyncStorage.getItem(`userEmoji_${userId}`);
          if (emoji) {
            setUserEmoji(emoji);
          }
        } catch (error) {
          console.error('Error loading emoji from storage:', error);
        }
      }
    };

    loadUserEmoji();
  }, [userId]);

  const updateUserEmoji = async (emoji) => {
    setUserEmoji(emoji);
    if (userId) {
      try {
        await AsyncStorage.setItem(`userEmoji_${userId}`, emoji);
      } catch (error) {
        console.error('Error saving emoji selection:', error);
      }
    }
  };

  return (
    <UserContext.Provider value={{ userId, setUserID, userEmail, setUserEmail, userEmoji, setUserEmoji: updateUserEmoji }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
