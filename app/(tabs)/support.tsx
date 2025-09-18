import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function SupportScreen() {
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>پشتیبانی</Text>
      <Text style={styles.subtitle}>برای ارتباط با ما یکی از روش‌های زیر را انتخاب کنید:</Text>

      {/* واتساپ */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#25D366' }]}
        onPress={() => openLink('https://wa.me/989388716739')}
      >
        <FontAwesome name="whatsapp" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>واتساپ</Text>
      </TouchableOpacity>

      {/* تلگرام */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#0088cc' }]}
        onPress={() => openLink('https://t.me/SOHRAB_LATIFI')}
      >
        <FontAwesome name="telegram" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>تلگرام</Text>
      </TouchableOpacity>

      {/* ایمیل (جیمیل) */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#DB4437' }]}
        onPress={() => openLink('mailto:priceapp.1920@gmail.com')}
      >
        <FontAwesome name="envelope" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>ایمیل (Gmail)</Text>
      </TouchableOpacity>

      {/* تماس تلفنی */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#FF9800' }]}
        onPress={() => openLink('tel:+989388716739')}
      >
        <FontAwesome name="phone" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>تماس تلفنی</Text>
      </TouchableOpacity>

      {/* وب‌سایت */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#4CAF50' }]}
        onPress={() => openLink('https://zabiullahjm-star.github.io/price-site/')}
      >
        <FontAwesome name="globe" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>وب‌سایت</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '90%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});