import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Restaurant Dashboard</Text>
      
      <View style={[styles.grid, isMobile ? { flexDirection: 'column' } : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }]}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#3182ce' }, !isMobile && { width: 300, margin: 15 }]} 
          onPress={() => navigation.navigate('POSScreen', { editBill: null })}
        >
          <Text style={styles.cardTitle}>📱 Take Orders</Text>
          <Text style={styles.cardSubtitle}>Create new bills for customers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#48bb78' }, !isMobile && { width: 300, margin: 15 }]} 
          onPress={() => navigation.navigate('MenuManagement')}
        >
          <Text style={styles.cardTitle}>📋 Manage Menu</Text>
          <Text style={styles.cardSubtitle}>Add, edit categories and items</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#ed8936' }, !isMobile && { width: 300, margin: 15 }]} 
          onPress={() => navigation.navigate('SalesHistory')}
        >
          <Text style={styles.cardTitle}>📈 Sales History</Text>
          <Text style={styles.cardSubtitle}>View past bills and revenue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#6b46c1' }, !isMobile && { width: 300, margin: 15 }]} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.cardTitle}>⚙️ Hotel Settings</Text>
          <Text style={styles.cardSubtitle}>Configure hotel specific options</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#e53e3e' }, !isMobile && { width: 300, margin: 15 }]} 
          onPress={handleLogout}
        >
          <Text style={styles.cardTitle}>🚪 Logout</Text>
          <Text style={styles.cardSubtitle}>Sign out of your account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ebf4ff' },
  contentContainer: { padding: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2b6cb0', marginBottom: 40, marginTop: 20, textAlign: 'center' },
  grid: { width: '100%', maxWidth: 1000 },
  card: { padding: 30, borderRadius: 15, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  cardTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  cardSubtitle: { color: '#e2e8f0', fontSize: 16 }
});
