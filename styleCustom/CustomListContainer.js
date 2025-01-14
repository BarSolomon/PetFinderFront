import React from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ListContainer = ({ data, renderItem }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA', // צבע רקע קל
  },
  list: {
    paddingHorizontal: 10,
  },
  item: {
    backgroundColor: '#FFFFFF', // צבע רקע פריט
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000000', // צבע הצל
    shadowOffset: { width: 0, height: 2 }, // מיקום הצל
    shadowOpacity: 0.1, // שקיפות הצל
    shadowRadius: 4, // רדיוס הצל
    elevation: 3, // עוצמת הצל באנדרואיד
  },
  itemText: {
    fontSize: 16,
    color: '#333333', // צבע טקסט
    fontFamily: 'tenor-sans ',
  },
});

export default ListContainer;
