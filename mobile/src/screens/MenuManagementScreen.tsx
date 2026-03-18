import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api';

export default function MenuManagementScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  
  // Add States
  const [newCatName, setNewCatName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  // Edit Item States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  // Edit Category States
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !selectedCatId) {
        setSelectedCatId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch menu');
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- ADD LOGIC ---
  const addCategory = async () => {
    if (!newCatName) return;
    try {
      await api.post('/menu/categories', { name: newCatName });
      setNewCatName('');
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not add category');
    }
  };

  const addItem = async () => {
    if (!newItemName || !newItemPrice || !selectedCatId) return;
    try {
      await api.post('/menu/items', { 
        name: newItemName, 
        price: Number(newItemPrice), 
        categoryId: selectedCatId 
      });
      setNewItemName('');
      setNewItemPrice('');
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not add item');
    }
  };

  // --- EDIT & DELETE LOGIC ---
  const saveCategoryEdit = async () => {
    if (!editCategoryName) return;
    try {
      await api.put(`/menu/categories/${editingCategory.id}`, { name: editCategoryName });
      setEditingCategory(null);
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not edit category');
    }
  };

  const deleteCategory = async (id: string) => {
    if(Platform.OS === 'web') {
      if(!window.confirm('Are you sure you want to delete this category? All items inside will be lost!')) return;
    }
    
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not delete category');
    }
  };

  const saveItemEdit = async () => {
    if (!editItemName || !editItemPrice) return;
    try {
      await api.put(`/menu/items/${editingItem.id}`, { 
        name: editItemName, 
        price: Number(editItemPrice) 
      });
      setEditingItem(null);
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not edit item');
    }
  };

  const deleteItem = async (id: string) => {
    if(Platform.OS === 'web') {
      if(!window.confirm('Are you sure you want to delete this item?')) return;
    }

    try {
      await api.delete(`/menu/items/${id}`);
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not delete item');
    }
  };

  // --- CSV IMPORT LOGIC ---
  const importCSV = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel'],
      });

      if (res.canceled) return;
      
      const file = res.assets[0];
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name || 'menu.csv');
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'text/csv',
        } as any);
      }

      await api.post('/menu/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Success', 'CSV imported successfully!');
      fetchMenu();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not import CSV');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* ─── EDIT ITEM MODAL ─── */}
      <Modal visible={!!editingItem} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TextInput style={styles.input} placeholder="Item Name" value={editItemName} onChangeText={setEditItemName} />
            <TextInput style={styles.input} placeholder="Price (₹)" value={editItemPrice} onChangeText={setEditItemPrice} keyboardType="numeric" />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveItemEdit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── EDIT CATEGORY MODAL ─── */}
      <Modal visible={!!editingCategory} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Category Name</Text>
            <TextInput style={styles.input} placeholder="Category Name" value={editCategoryName} onChangeText={setEditCategoryName} />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingCategory(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCategoryEdit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* TOP: ADD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Category</Text>
        <TextInput 
          style={styles.input} 
          placeholder="New Category Name (e.g. Starters)" 
          value={newCatName}
          onChangeText={setNewCatName}
        />
        <TouchableOpacity style={styles.button} onPress={addCategory}>
          <Text style={styles.buttonText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Menu Item</Text>
        {categories.length === 0 ? (
          <Text style={{color: 'red'}}>Please add a category first.</Text>
        ) : (
          <View>
            <View style={styles.row}>
              {categories.map((cat: any) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.badge, selectedCatId === cat.id && styles.badgeSelected]}
                  onPress={() => setSelectedCatId(cat.id)}
                >
                  <Text style={selectedCatId === cat.id ? {color: 'white'} : {color: '#333'}}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Item Name (e.g. Garlic Bread)" value={newItemName} onChangeText={setNewItemName} />
            <TextInput style={styles.input} placeholder="Price (₹)" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="numeric" />
            <TouchableOpacity style={styles.button} onPress={addItem}>
              <Text style={styles.buttonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bulk Import Menu</Text>
        <TouchableOpacity style={[styles.button, {backgroundColor: '#e53e3e'}]} onPress={importCSV}>
          <Text style={styles.buttonText}>📁 Upload CSV File</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM: MANAGE EXISTING MENU */}
      <View style={[styles.section, {borderBottomWidth: 0}]}>
        <Text style={styles.sectionTitle}>Current Menu</Text>
        {categories.map((cat: any) => (
          <View key={cat.id} style={{marginBottom: 20}}>
            
            {/* CATEGORY HEADER */}
            <View style={styles.categoryHeaderRow}>
              <Text style={styles.categoryTitleText}>{cat.name}</Text>
              <View style={styles.actionIcons}>
                 <TouchableOpacity onPress={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }} style={{marginRight: 15}}>
                   <Text style={{color: '#3182ce', fontWeight: 'bold'}}>✏️ Edit</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => deleteCategory(cat.id)}>
                   <Text style={{color: '#e53e3e', fontWeight: 'bold'}}>🗑️ Del</Text>
                 </TouchableOpacity>
              </View>
            </View>

            {/* ITEMS LIST */}
            {cat.menuItems?.length === 0 && <Text style={{color: '#a0aec0'}}>No items.</Text>}
            {cat.menuItems?.map((item: any) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 16}}>{item.name}</Text>
                  <Text style={{fontSize: 14, color: '#38a169', fontWeight: 'bold'}}>₹{item.price.toFixed(2)}</Text>
                </View>

                {/* ITEM ACTIONS */}
                <View style={[styles.actionIcons, {opacity: 0.8}]}>
                 <TouchableOpacity 
                   onPress={() => { 
                     setEditingItem(item); 
                     setEditItemName(item.name); 
                     setEditItemPrice(String(item.price)); 
                   }} 
                   style={{marginRight: 15}}
                 >
                   <Text style={{color: '#3182ce'}}>✏️ Edit</Text>
                 </TouchableOpacity>

                 <TouchableOpacity onPress={() => {
                   if(Platform.OS === 'web' && !window.confirm('Delete this item?')) return;
                   deleteItem(item.id);
                 }}>
                   <Text style={{color: '#e53e3e'}}>🗑️ Del</Text>
                 </TouchableOpacity>
                </View>

              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  contentContainer: { alignSelf: 'center', width: '100%', maxWidth: 800, paddingBottom: 50 },
  section: { padding: 20, backgroundColor: 'white', marginBottom: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#2d3748' },
  input: { borderWidth: 1, borderColor: '#cbd5e0', padding: 15, borderRadius: 5, marginBottom: 10, fontSize: 16 },
  button: { backgroundColor: '#3182ce', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  badge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 10, marginBottom: 10 },
  badgeSelected: { backgroundColor: '#3182ce' },
  
  categoryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderColor: '#e2e8f0', paddingBottom: 5, marginBottom: 10 },
  categoryTitleText: { fontSize: 20, fontWeight: 'bold', color: '#4a5568' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#edf2f7' },
  actionIcons: { flexDirection: 'row' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 10, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  saveBtn: { backgroundColor: '#48bb78', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5, marginLeft: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
  cancelBtnText: { color: '#4a5568', fontWeight: 'bold' }
});
