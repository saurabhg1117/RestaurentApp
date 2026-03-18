import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function LoginScreen({ navigation }: any) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter User ID and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { userId, password });
      const { token, restaurant } = response.data;
      
      await AsyncStorage.setItem('token', token);
      
      // Update our global state or just reset navigation
      const targetScreen = restaurant.isSuperAdmin ? 'SuperAdmin' : 'Dashboard';
      navigation.reset({
        index: 0,
        routes: [{ name: targetScreen }],
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Login failed. Check your data.';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Restaurant POS</Text>
        <Text style={styles.subtitle}>Partner Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Contact Administrator to create your account.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 15, width: '100%', maxWidth: 400, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2b6cb0', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#4a5568', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#cbd5e0', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#3182ce', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footerText: { color: '#718096', fontSize: 12, textAlign: 'center', marginTop: 30 }
});
