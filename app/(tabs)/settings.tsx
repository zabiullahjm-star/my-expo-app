import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../languageContext';
import  translations  from '../translations';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isPersian, toggleLanguage } = useLanguage();
  
  const t = isPersian ? translations.fa : translations.en;
  // fallback برای ترجمه‌ها
  const darkModeLabel = t.darkMode || (isPersian ? "حالت تاریک" : "Dark Mode");
  const persianLangLabel = t.persianLanguage || (isPersian ? "زبان فارسی" : "Persian Language");
  const backgroundColor = isDark ? '#121212' : '#F9FAFB';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const cardColor = isDark ? '#1E1E1E' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{t.settingsTitle || (isPersian ? "تنظیمات" : "Settings")}</Text>

      {/* گزینه تغییر حالت تاریک */}
      <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
        <Text style={[styles.settingText, { color: textColor }]}>
          {darkModeLabel}
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
        />
      </View>

      {/* گزینه تغییر زبان */}
      <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
        <Text style={[styles.settingText, { color: textColor }]}>
          {persianLangLabel}
        </Text>
        <Switch
          value={isPersian}
          onValueChange={toggleLanguage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
  },
});