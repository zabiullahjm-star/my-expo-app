import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../languageContext";
import translations from "../translations";

export default function SupportScreen() {
  const { isDark } = useTheme();
  const { isPersian } = useLanguage();
  const t = isPersian ? translations.fa : translations.en;

  // Fix: fallback for supportTab if not defined
  const supportTitle =
    t.supportTab ||
    (isPersian ? "پشتیبانی" : "Support");

  const openLink = (url: string) => Linking.openURL(url);

  const backgroundColor = isDark ? "#121212" : "#F9FAFB";
  const textColor = isDark ? "#ffffff" : "#111827";
  const subtitleColor = isDark ? "#BBBBBB" : "#6B7280";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{supportTitle}</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>
        {isPersian
          ? "برای ارتباط با ما یکی از روش‌های زیر را انتخاب کنید:"
          : "Choose one of the following methods to contact us:"}
      </Text>

      {/* WhatsApp */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#25D366" }]}
        onPress={() => openLink("https://wa.me/989388716739")}
      >
        <FontAwesome name="whatsapp" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>{isPersian ? "واتساپ" : "WhatsApp"}</Text>
      </TouchableOpacity>

      {/* Telegram */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#0088cc" }]}
        onPress={() => openLink("https://t.me/SOHRAB_LATIFI")}
      >
        <FontAwesome name="telegram" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>{isPersian ? "تلگرام" : "Telegram"}</Text>
      </TouchableOpacity>

      {/* Email */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#DB4437" }]}
        onPress={() => openLink("mailto:priceapp.1920@gmail.com")}
      >
        <FontAwesome name="envelope" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>{isPersian ? "ایمیل" : "Email"}</Text>
      </TouchableOpacity>

      {/* Phone */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FF9800" }]}
        onPress={() => openLink("tel:+989388716739")}
      >
        <FontAwesome name="phone" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>{isPersian ? "تماس" : "Call"}</Text>
      </TouchableOpacity>

      {/* Website */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#4CAF50" }]}
        onPress={() => openLink("https://zabiullahjm-star.github.io/price-site/")}
      >
        <FontAwesome name="globe" size={28} color="white" style={styles.icon} />
        <Text style={styles.cardText}>{isPersian ? "وب‌سایت" : "Website"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width: "90%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
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
    fontWeight: "600",
    color: "#fff",
  },
});