import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Platform, TextInput, useWindowDimensions } from 'react-native';
import api from '../api';

export default function POSScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Breakpoint for Tablets/Phones

  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<{item: any, quantity: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // GST State
  const [gstRate, setGstRate] = useState<number>(0);
  const [gstNumber, setGstNumber] = useState<string>('');

  useEffect(() => {
    fetchMenu();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
     try {
       const res = await api.get('/auth/me');
       if (res.data.gstNumber) setGstNumber(res.data.gstNumber);
       if (res.data.gstRate !== undefined) setGstRate(res.data.gstRate);
     } catch (err) {
       console.error('Failed to fetch profile for GST:', err);
     }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load menu');
    }
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find(i => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.item.id !== itemId);
    });
  };

  const cartSubtotal = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
  const gstAmount = (cartSubtotal * gstRate) / 100;
  const cartTotal = cartSubtotal + gstAmount;

  const generateBill = async () => {
    if (cart.length === 0) return;
    if (gstRate > 0 && !gstNumber) {
      Alert.alert('Validation Error', 'GST Number is required when applying GST to the bill.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: cart.map(c => ({ menuItemId: c.item.id, quantity: c.quantity })),
        gstRate,
        gstNumber: gstRate > 0 ? gstNumber : undefined
      };
      
      const res = await api.post('/bills', payload);
      setGeneratedBill(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not generate bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 300);
    } else {
      Alert.alert('Printing', 'Sent to thermal printer!');
    }
  };

  // Dynamic layout changes
  const containerStyle = isMobile ? { flexDirection: 'column' as const } : { flexDirection: 'row' as const };
  const menuSectionStyle = isMobile ? { flex: 1, borderBottomWidth: 2, borderColor: '#cbd5e0', paddingBottom: 20 } : { flex: 1.5, borderRightWidth: 1, borderColor: '#cbd5e0' };
  const cartSectionStyle = isMobile ? { flex: undefined, height: 600 } : { flex: 1 };

  return (
    <View style={[styles.container, containerStyle, isPrinting && { opacity: 0 }]}>
      
      {/* ─── RECEIPT MODAL ─── */}
      <Modal visible={!!generatedBill} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, isPrinting && { backgroundColor: 'transparent' }]}>
          <View style={[styles.receiptPaper, { width: isMobile ? '90%' : 350 }, isPrinting && { elevation: 0, shadowOpacity: 0 }]}>
            <Text style={styles.receiptHeader}>{generatedBill?.restaurant?.name || 'Restaurant'}</Text>
            {generatedBill?.restaurant?.address && (
              <Text style={styles.receiptSub}>{generatedBill.restaurant.address}</Text>
            )}
            {generatedBill?.restaurant?.mobile && (
              <Text style={styles.receiptSub}>Mob: {generatedBill.restaurant.mobile}</Text>
            )}
            {generatedBill?.gstNumber && (
              <Text style={styles.receiptSub}>GSTIN: {generatedBill?.gstNumber}</Text>
            )}
            
            <View style={styles.divider} />
            <Text style={styles.receiptSub}>Receipt #{generatedBill?.id?.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.receiptSub}>{new Date().toLocaleString()}</Text>
            
            <View style={styles.divider} />
            
            <ScrollView style={{maxHeight: isMobile ? 300 : 400, width: '100%'}}>
              {generatedBill?.items?.map((bi: any) => (
                <View key={bi.id} style={styles.receiptRow}>
                  <Text style={styles.receiptItemName}>{bi.quantity}x {bi.menuItem.name}</Text>
                  <Text style={styles.receiptItemPrice}>₹{(bi.quantity * bi.price).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />
            
            <View style={styles.receiptCalcRow}>
              <Text style={styles.receiptCalcText}>Subtotal</Text>
              <Text style={styles.receiptCalcText}>₹{generatedBill?.subTotal?.toFixed(2)}</Text>
            </View>

            {generatedBill?.gstRate > 0 && (
              <View style={styles.receiptCalcRow}>
                <Text style={styles.receiptCalcText}>GST ({generatedBill?.gstRate}%)</Text>
                <Text style={styles.receiptCalcText}>₹{generatedBill?.gstAmount?.toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.divider, { borderStyle: 'solid', height: 2 }]} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalText}>TOTAL</Text>
              <Text style={styles.receiptTotalText}>₹{generatedBill?.totalAmount?.toFixed(2)}</Text>
            </View>

            {/* Warm Welcome Message */}
            <Text style={[styles.receiptSub, { marginTop: 15, fontWeight: 'bold', textAlign: 'center', fontStyle: 'italic', color: '#4a5568' }]}>
              {generatedBill?.restaurant?.warmMessage || 'Thank you! Visit Again!'}
            </Text>

            {!isPrinting && (
              <>
                <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                  <Text style={styles.printBtnText}>🖨️ PRINT BILL</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{marginTop: 15, padding: 10}} 
                  onPress={() => { setGeneratedBill(null); setCart([]); setGstRate(0); setGstNumber(''); }}
                >
                  <Text style={{color: '#e53e3e', fontSize: 16, fontWeight: 'bold'}}>Cancel & Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* LEFT / TOP SIDE: Menu Selection */}
      <View style={[styles.menuSection, menuSectionStyle]}>
        <Text style={styles.headerTitle}>Select Items</Text>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          {categories.map((cat: any) => (
            <View key={cat.id} style={{ marginBottom: 15 }}>
              <Text style={styles.categoryTitle}>{cat.name}</Text>
              <View style={styles.itemGrid}>
                {cat.menuItems?.length === 0 && <Text style={{color: '#888'}}>No items</Text>}
                {cat.menuItems?.map((item: any) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.itemCard, isMobile && { width: '45%', margin: '2%' }]}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* RIGHT / BOTTOM SIDE: Cart & Billing */}
      <View style={[styles.cartSection, cartSectionStyle]}>
        <Text style={styles.headerTitle}>Current Order</Text>
        
        <ScrollView style={{ flex: 1, marginTop: 10 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {cart.length === 0 && <Text style={{color: '#888', textAlign: 'center', marginTop: 50}}>Cart is empty</Text>}
          
          {cart.map((c) => (
            <View key={c.item.id} style={styles.cartItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{c.item.name}</Text>
                <Text style={{color: '#666'}}>₹{c.item.price.toFixed(2)} x {c.quantity}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(c.item.id)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{c.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(c.item)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          
          {/* GST Selection UI Removed and locked to Hotel Settings */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#4a5568', fontStyle: 'italic' }}>
              GST applied from Hotel Settings: {gstRate > 0 ? `${gstRate}%` : '0%'}
            </Text>
            {gstNumber ? (
              <Text style={{ fontSize: 12, color: '#718096' }}>GSTIN: {gstNumber}</Text>
            ) : null}
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalText}>Subtotal:</Text>
            <Text style={styles.subtotalText}>₹{cartSubtotal.toFixed(2)}</Text>
          </View>
          
          {gstRate > 0 && (
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>GST ({gstRate}%):</Text>
              <Text style={styles.subtotalText}>₹{gstAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>₹{cartTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.generateBtn, cart.length === 0 && {backgroundColor: '#a0aec0'}]} 
            onPress={generateBill}
            disabled={cart.length === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>PAY & GENERATE BILL</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3748', borderBottomWidth: 2, borderColor: '#e2e8f0', paddingBottom: 10 },
  
  menuSection: { padding: 15 },
  categoryTitle: { fontSize: 18, fontWeight: 'bold', color: '#4a5568', marginVertical: 10 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  itemCard: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 8, margin: 5, width: 140,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', textAlign: 'center' },
  itemPrice: { fontSize: 14, color: '#38a169', marginTop: 5, fontWeight: 'bold' },

  cartSection: { padding: 15, backgroundColor: '#fff' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7fafc', padding: 10, borderRadius: 8, marginBottom: 10 },
  cartItemName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { backgroundColor: '#e2e8f0', width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15 },

  footer: { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 15, marginTop: 10 },
  
  gstOption: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5, borderWidth: 1, borderColor: '#cbd5e0', marginRight: 10 },
  gstOptionSelected: { backgroundColor: '#3182ce', borderColor: '#3182ce' },
  gstOptionText: { color: '#4a5568', fontWeight: 'bold' },
  gstInput: { borderWidth: 1, borderColor: '#cbd5e0', padding: 15, borderRadius: 5, marginBottom: 10, backgroundColor: '#f7fafc' },
  
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  subtotalText: { fontSize: 16, color: '#4a5568' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, marginTop: 5 },
  totalText: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#e53e3e' },
  
  generateBtn: { backgroundColor: '#48bb78', padding: 18, borderRadius: 8, alignItems: 'center', shadowColor: '#48bb78', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  generateBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

  // Receipt Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  receiptPaper: { backgroundColor: '#fff', padding: 25, borderRadius: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  receiptHeader: { fontSize: 22, fontWeight: 'bold', color: '#1a202c', marginBottom: 5 },
  receiptSub: { fontSize: 14, color: '#718096' },
  divider: { height: 1, backgroundColor: '#e2e8f0', width: '100%', marginVertical: 15, borderStyle: 'dashed' },
  receiptCalcRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  receiptCalcText: { fontSize: 14, color: '#4a5568' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  receiptItemName: { fontSize: 16, color: '#2d3748', flex: 1 },
  receiptItemPrice: { fontSize: 16, color: '#2d3748', fontWeight: 'bold' },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25, marginTop: 10 },
  receiptTotalText: { fontSize: 20, fontWeight: 'bold', color: '#1a202c' },
  printBtn: { backgroundColor: '#2b6cb0', width: '100%', padding: 15, borderRadius: 5, alignItems: 'center' },
  printBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
