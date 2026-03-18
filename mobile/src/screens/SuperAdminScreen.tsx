import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function SuperAdminScreen({ navigation }: any) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // ... rest of state stays same ...  // New Restaurant Form
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/restaurants');
      setRestaurants(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'User ID and Password are required');
      return;
    }

    try {
      await api.post('/admin/restaurants', { userId, password, name, ownerName, address, mobile });
      Alert.alert('Success', 'Restaurant created successfully');
      setShowAddModal(false);
      resetForm();
      fetchRestaurants();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create restaurant');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/restaurants/${id}/status`, { isActive: !currentStatus });
      fetchRestaurants();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure? This will remove all restaurant data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/restaurants/${id}`);
            fetchRestaurants();
          } catch (err) {
            Alert.alert('Error', 'Delete failed');
          }
      }}
    ]);
  };

  const resetForm = () => {
    setUserId(''); setPassword(''); setName(''); setOwnerName(''); setAddress(''); setMobile('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Super Admin Panel</Text>
          <TouchableOpacity onPress={handleLogout}>
             <Text style={{ color: '#feb2b2', fontSize: 12, marginTop: 5 }}>Logout</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add Restaurant</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
        {loading && <ActivityIndicator size="large" color="#3182ce" />}
        {restaurants.filter(r => !r.isSuperAdmin).map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.restName}>{r.name || 'Set Name'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: r.isActive ? '#48bb78' : '#e53e3e' }]}>
                   <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{r.isActive ? 'ACTIVE' : 'SUSPENDED'}</Text>
                </View>
              </View>
              <Text style={styles.restSub}>{r.ownerName || r.userId} ({r.userId})</Text>
              <Text style={styles.restDate}>Created: {new Date(r.createdAt).toLocaleDateString()}</Text>
              
              <View style={{flexDirection: 'row', marginTop: 10}}>
                <TouchableOpacity 
                   style={[styles.smallBtn, {backgroundColor: r.isActive ? '#fbd38d' : '#90cdf4'}]}
                   onPress={() => handleToggleStatus(r.id, r.isActive)}
                >
                   <Text style={styles.smallBtnText}>{r.isActive ? '🚫 Suspend Access' : '✅ Grant Access'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   style={[styles.smallBtn, {backgroundColor: '#fed7d7', marginLeft: 10}]}
                   onPress={() => handleDelete(r.id)}
                >
                   <Text style={[styles.smallBtnText, {color: '#c53030'}]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={showAddModal} animationType="slide">
        <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>New Restaurant Partner</Text>
          
          <TextInput style={styles.input} placeholder="Partner User ID *" value={userId} onChangeText={setUserId} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Login Password *" value={password} onChangeText={setPassword} secureTextEntry />
          
          <View style={{marginVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0', paddingBottom: 5}}>
             <Text style={{color: '#718096', fontSize: 12}}>Optional Details (Owner can fill later)</Text>
          </View>

          <TextInput style={styles.input} placeholder="Cafe/Restaurant Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Owner Full Name" value={ownerName} onChangeText={setOwnerName} />
          <TextInput style={styles.input} placeholder="Full Address" value={address} onChangeText={setAddress} />
          <TextInput style={styles.input} placeholder="Mobile Number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />

          <TouchableOpacity style={styles.saveBtn} onPress={handleAddRestaurant}>
            <Text style={styles.saveBtnText}>Generate Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
            <Text style={styles.cancelBtnText}>Back to List</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: { padding: 20, backgroundColor: '#2d3748', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  addBtn: { backgroundColor: '#48bb78', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  restName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  restSub: { color: '#4a5568', marginTop: 2 },
  restDate: { fontSize: 12, color: '#718096', marginTop: 5 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  smallBtnText: { fontSize: 13, fontWeight: 'bold', color: '#2d3748' },
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#2d3748', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#cbd5e0', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  saveBtn: { backgroundColor: '#3182ce', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 15, marginTop: 10, alignItems: 'center' },
  cancelBtnText: { color: '#e53e3e', fontWeight: 'bold' }
});
