import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../ThemeContext";
import UpdateChecker from "../UpdateChecker"; // 👈 مسیر درست و با حرف بزرگ

// 📌 کامپوننت اصلی App
const App = () => {
  const { isDark, toggleTheme } = useTheme();
  const [prices, setPrices] = useState<any>({});
  const [usdtToToman, setUsdtToToman] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = isDark ? "#121212" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";

  const COINS = [
    "bitcoin", "ethereum", "binancecoin", "ripple", "dogecoin", "solana",
    "cardano", "tron", "polkadot", "matic-network", "hyperliquid", "sui",
    "stellar", "litecoin", "whitebit", "uniswap", "mantle", "monero",
    "ethena", "pepe", "aave", "okb", "memecore", "near", "bittensor",
    "aptos", "arbitrum", "kaspa", "cosmos", "algorand", "vechain",
    "susds", "bonk", "fasttoken", "sky", "filecoin", "optimism",
    "celestia", "render-token",
  ];

  // 📌 گرفتن قیمت‌ها
  const fetchCryptoPrices = async () => {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      const data = await res.json();
      setPrices(data);
      await AsyncStorage.setItem("CACHED_PRICES", JSON.stringify(data));
    } catch (err) {
      console.error("CGk error:", err);
      setError("⚠️ خطا در بروزرسانی قیمت‌ها");

      // 👇 اگر اینترنت قطع شد → آخرین داده ذخیره‌شده
      const cached = await AsyncStorage.getItem("CACHED_PRICES");
      if (cached) setPrices(JSON.parse(cached));
    }
  };

  const fetchUSDTtoToman = async () => {
    try {
      const res = await fetch("https://api.wallex.ir/v1/markets");
      const data = await res.json();
      const usdt = data.result.symbols["USDTTMN"];
      if (usdt && usdt.stats && usdt.stats.lastPrice) {
        setUsdtToToman(parseFloat(usdt.stats.lastPrice));
        await AsyncStorage.setItem("CACHED_USDT", usdt.stats.lastPrice.toString());
      } else {
        setUsdtToToman(105000);
      }
    } catch (err) {
      const cached = await AsyncStorage.getItem("CACHED_USDT");
      if (cached) setUsdtToToman(parseFloat(cached));
      else setUsdtToToman(105000);
    }
  };

  const loadData = async (firstTime = false) => {
    if (firstTime) setInitialLoading(true);
    setError(null);
    await Promise.allSettled([fetchCryptoPrices(), fetchUSDTtoToman()]);
    if (firstTime) setInitialLoading(false);
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>در حال بارگذاری...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity onPress={() => loadData(false)}>
          <Text style={{ color: "blue" }}>🔄 تلاش دوباره</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: textColor }]}>
          📊 .قیمت ارزهای دیجیتال + تغییرات ۲۴ساعته.
        </Text>{usdtToToman && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1e1e1e" : "#fff",
                shadowOpacity: isDark ? 0 : 0.1,
              },
            ]}
          >
            <Text style={[styles.symbol, { color: textColor }]}>USDT</Text>
            <Text style={[styles.price, { color: textColor }]}>
              تومان: {usdtToToman.toLocaleString()}
            </Text>
          </View>
        )}

        {COINS.map((coin) => {
          const coinData = prices[coin];
          const usdtPrice = coinData?.usd;
          const change = coinData?.usd_24h_change;
          if (!usdtPrice) return null;
          const changeColor = change > 0 ? "green" : change < 0 ? "red" : "gray";

          return (
            <View
              key={coin}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? "#1e1e1e" : "#fff",
                  shadowOpacity: isDark ? 0 : 0.1,
                },
              ]}
            >
              <Text style={[styles.symbol, { color: textColor }]}>
                {coin.toUpperCase()}
              </Text>
              <Text style={[styles.price, { color: textColor }]}>
                قیمت به USDT: {usdtPrice.toLocaleString()}
              </Text>
              <Text style={[styles.change, { color: changeColor }]}>
                تغییر ۲۴ساعته: {change ? change.toFixed(2) + "%" : "نامعلوم"}
              </Text>
              {usdtToToman && (
                <Text style={[styles.price, { color: textColor }]}>
                  قیمت به تومان: {(usdtPrice * usdtToToman).toLocaleString()}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* دکمه حالت شب/روز */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDark ? "#333" : "#ddd",
          justifyContent: "center",
          alignItems: "center",
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</Text>
      </TouchableOpacity>

      {/* ✅ UpdateChecker */}
      <UpdateChecker />
    </View>
  );
};

// 📌 استایل‌ها
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  symbol: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#2c3e50" },
  price: { fontSize: 16, color: "#555" },
  change: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  scrollContent: { flexGrow: 1, padding: 20 },
});

// ✅ درست برای Expo Router
export default App;