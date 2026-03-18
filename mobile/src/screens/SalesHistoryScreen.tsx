import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import api from '../api';

export default function SalesHistoryScreen({ navigation }: any) {
  const [summary, setSummary] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    
    // Refresh when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const summaryRes = await api.get('/bills/analytics/summary');
      setSummary(summaryRes.data);

      const billsRes = await api.get('/bills');
      setBills(billsRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load sales history');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Sales & Analytics</Text>

      {/* Analytics Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#3182ce' }]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹{summary.totalRevenue?.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#48bb78' }]}>
            <Text style={styles.summaryLabel}>Total Bills</Text>
            <Text style={styles.summaryValue}>{summary.totalBills}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ed8936' }]}>
            <Text style={styles.summaryLabel}>Avg Bill</Text>
            <Text style={styles.summaryValue}>₹{summary.avgBillValue?.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Daily Revenue Chart (Simple List Format for Mobile) */}
      {summary?.dailyRevenue?.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Daily Revenue</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {summary.dailyRevenue.map((day: any) => (
              <View key={day.date} style={styles.dayBadge}>
                <Text style={styles.dayText}>{day.date}</Text>
                <Text style={styles.dayAmount}>₹{day.revenue.toFixed(2)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Bills List */}
      <Text style={styles.sectionTitle}>Recent Bills</Text>
      <ScrollView style={{ flex: 1 }}>
        {bills.length === 0 && <Text style={{ color: '#888' }}>No bills generated yet.</Text>}
        {bills.map((bill) => (
          <View key={bill.id} style={styles.billCard}>
            <View style={styles.billHeader}>
              <View>
                <Text style={styles.billId}>Receipt #{bill.id.substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.billTotal}>₹{bill.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <Text style={styles.billDate}>{new Date(bill.createdAt).toLocaleString()}</Text>
            
            {(bill.gstRate > 0) && (
              <Text style={styles.billGst}>Includes {bill.gstRate}% GST (₹{bill.gstAmount.toFixed(2)})</Text>
            )}

            <View style={styles.itemsList}>
              {bill.items?.map((item: any) => (
                 <Text key={item.id} style={styles.itemText}>
                    {item.quantity}x {item.menuItem?.name}
                 </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7fafc' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2d3748', marginBottom: 20 },
  
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, padding: 20, borderRadius: 10, marginHorizontal: 5, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  summaryLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  summaryValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#4a5568', marginBottom: 10 },
  
  dayBadge: { backgroundColor: '#e2e8f0', padding: 15, borderRadius: 8, marginRight: 10, minWidth: 110, alignItems: 'center' },
  dayText: { fontSize: 14, color: '#4a5568', fontWeight: 'bold', marginBottom: 5 },
  dayAmount: { fontSize: 16, color: '#2b6cb0', fontWeight: 'bold' },

  billCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  billId: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  billTotal: { fontSize: 18, fontWeight: 'bold', color: '#e53e3e' },
  billDate: { fontSize: 12, color: '#a0aec0', marginBottom: 5 },
  billGst: { fontSize: 12, color: '#38a169', fontWeight: 'bold', marginBottom: 5 },

  itemsList: { marginTop: 10, borderTopWidth: 1, borderColor: '#edf2f7', paddingTop: 10 },
  itemText: { fontSize: 14, color: '#4a5568', marginBottom: 2 }
});
