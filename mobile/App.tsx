import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './src/api';

import DashboardScreen from './src/screens/DashboardScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import MenuManagementScreen from './src/screens/MenuManagementScreen';
import POSScreen from './src/screens/POSScreen';
import SalesHistoryScreen from './src/screens/SalesHistoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>("Login");

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Double check who we are
        const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.isSuperAdmin) {
          setInitialRoute("SuperAdmin");
        } else {
          setInitialRoute("Dashboard");
        }
      }
    } catch (e) {
      // Token probably invalid or expired, stay on Login
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ebf4ff' }}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SuperAdmin" 
          component={SuperAdminScreen} 
          options={{ title: 'Admin Control Center' }} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Restaurent POS', headerLeft: () => null }} 
        />
        <Stack.Screen 
          name="POSScreen" 
          component={POSScreen} 
          options={{ title: 'Take Orders' }} 
        />
        <Stack.Screen 
          name="MenuManagement" 
          component={MenuManagementScreen} 
          options={{ title: 'Manage Menu' }} 
        />
        <Stack.Screen 
          name="SalesHistory" 
          component={SalesHistoryScreen} 
          options={{ title: 'Sales History' }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Hotel Settings' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
