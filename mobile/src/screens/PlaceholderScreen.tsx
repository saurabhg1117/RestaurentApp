import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GenericScreen({ route, navigation }: any) {
  // Uses generic UI placeholder for now
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{route.name} is coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 }
});
