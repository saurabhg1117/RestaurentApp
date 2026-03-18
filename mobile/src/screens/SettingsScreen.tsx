import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [warmMessage, setWarmMessage] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      setName(res.data.name || '');
      setOwnerName(res.data.ownerName || '');
      setAddress(res.data.address || '');
      setMobile(res.data.mobile || '');
      setGstNumber(res.data.gstNumber || '');
      setGstRate(res.data.gstRate?.toString() || '0');
      setWarmMessage(res.data.warmMessage || 'Thank you! Visit Again!');
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { name, ownerName, address, mobile, gstNumber, gstRate, warmMessage };
      if (password) {
        payload.password = password;
      }
      
      await api.patch('/auth/me', payload);
      Alert.alert('Success', 'Profile updated successfully');
      setPassword(''); // Clear password field
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Restaurant Profile</Text>
      <Text style={styles.subtitle}>Update your restaurant details for the bill receipts.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Restaurant Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Spice Route Cafe" />

        <Text style={styles.label}>Owner Name</Text>
        <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Your Full Name" />

        <Text style={styles.label}>Address</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={address} onChangeText={setAddress} placeholder="Physical address" multiline />

        <Text style={styles.label}>Contact Mobile</Text>
        <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="Mobile number" keyboardType="phone-pad" />

        <Text style={styles.label}>Business GST Number (Optional)</Text>
        <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} placeholder="e.g. 22AAAAA0000A1Z5" autoCapitalize="characters" />

        <Text style={styles.label}>Default GST Rate (%)</Text>
        <TextInput style={styles.input} value={gstRate} onChangeText={setGstRate} placeholder="e.g. 18" keyboardType="numeric" />

        <Text style={styles.label}>Warm Message (Bill Footer)</Text>
        <TextInput style={styles.input} value={warmMessage} onChangeText={setWarmMessage} placeholder="e.g. Thank you! Visit Again!" />

        <View style={styles.divider} />
        
        <Text style={styles.label}>Change Password (Leave blank to keep current)</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
  subtitle: { fontSize: 14, color: '#718096', marginTop: 5, marginBottom: 20 },
  form: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 2 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4a5568', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#cbd5e0', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  saveBtn: { backgroundColor: '#3182ce', padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
