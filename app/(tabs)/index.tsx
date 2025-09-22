// index.tsx (TypeScript-fixed)
import "react-native-reanimated";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../ThemeContext";
import UpdateChecker from "../UpdateChecker";

type PriceRecord = {
  usd?: number;
  usd_24h_change?: number;
};

const COINS: string[] = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "ripple",
  "dogecoin",
  "solana",
  "cardano",
  "tron",
  "polkadot",
  "matic-network",
  "hyperliquid",
  "sui",
  "stellar",
  "litecoin",
  "whitebit",
  "uniswap",
  "mantle",
  "monero",
  "ethena",
  "pepe",
  "aave",
  "okb",
  "memecore",
  "near",
  "bittensor",
  "aptos",
  "arbitrum",
  "kaspa",
  "cosmos",
  "algorand",
  "vechain",
  "susds",
  "bonk",
  "fasttoken",
  "sky",
  "filecoin",
  "optimism",
  "celestia",
  "render-token",
  "fartcoin",
];

const STORAGE_KEYS = {
  PRICES: "CACHED_PRICES",
  USDT: "CACHED_USDT",
};

// تابع برای تولید URL لوگو از کوین‌گکو
const getCoinLogoUrl = (coinId: string): string => {
  return `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
};

const App: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [prices, setPrices] = useState<Record<string, PriceRecord>>({});
  const [coinImages, setCoinImages] = useState<Record<string, string>>({});
  const [usdtToToman, setUsdtToToman] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = isDark ? "#121212" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";

  // ---------- fetch prices (fixed URL) ----------
  const fetchCryptoPrices = useCallback(async () => {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      const data = (await res.json()) as Record<string, PriceRecord>;
      setPrices(data);
      await AsyncStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(data));
    } catch (err) {
      console.warn("CGk error:", err);
      setError("⚠️ خطا در بروزرسانی قیمت‌ها");
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PRICES);
      if (cached) {
        try {
          setPrices(JSON.parse(cached));
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  // ---------- fetch coin images ----------
  const fetchCoinImages = useCallback(async () => {
    const images: Record<string, string> = {};

    // از API ساده‌تر برای دریافت لوگوها استفاده می‌کنیم
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(",")}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`);
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((coin: any) => {
          if (coin?.image) {
            images[coin.id] = coin.image;
          }
        });
        setCoinImages(images);
      }
    } catch (error) {
      console.warn("Error fetching coin images:", error);
      // اگر خطا در دریافت لوگوها بود، از لوگوی پیش‌فرض استفاده می‌کنیم
      COINS.forEach(coin => {
        images[coin] = "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png";
      });
      setCoinImages(images);
    }
  }, []);// ---------- fetch USDT->Toman ----------
  const fetchUSDTtoToman = useCallback(async () => {
    try {
      const res = await fetch("https://api.wallex.ir/v1/markets");
      const data = await res.json();
      const usdt = data?.result?.symbols?.["USDTTMN"];
      if (usdt && usdt.stats && usdt.stats.lastPrice) {
        const val = parseFloat(usdt.stats.lastPrice);
        setUsdtToToman(val);
        await AsyncStorage.setItem(STORAGE_KEYS.USDT, val.toString());
      } else {
        setUsdtToToman(105000);
      }
    } catch (err) {
      console.warn("Wallex error:", err);
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.USDT);
      if (cached) {
        const parsed = parseFloat(cached);
        if (!Number.isNaN(parsed)) setUsdtToToman(parsed);
        else setUsdtToToman(105000);
      } else {
        setUsdtToToman(105000);
      }
    }
  }, []);

  // ---------- load all ----------
  const loadData = useCallback(
    async (firstTime = false) => {
      if (firstTime) setInitialLoading(true);
      setError(null);
      await Promise.allSettled([
        fetchCryptoPrices(),
        fetchCoinImages(),
        fetchUSDTtoToman()
      ]);
      if (firstTime) setInitialLoading(false);
    },
    [fetchCryptoPrices, fetchCoinImages, fetchUSDTtoToman]
  );

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  // ---------- helpers for typed styles ----------
  const headerStyle: StyleProp<TextStyle> = [styles.header, { color: textColor }];
  const containerStyle: StyleProp<ViewStyle> = [styles.container, { backgroundColor }];

  // تابع برای دریافت لوگوی ارز
  const getCoinLogo = (coinId: string): string => {
    return coinImages[coinId] || "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png";
  };

  // ---------- render ----------
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: textColor }}>در حال بارگذاری...</Text>
      </View>
    );
  }

  if (error && Object.keys(prices).length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity onPress={() => loadData(true)}>
          <Text style={{ color: "#2196f3" }}>🔄 تلاش دوباره</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={headerStyle}>📊 قیمت ارزهای دیجیتال + تغییرات ۲۴ساعته</Text>

        {usdtToToman !== null && (
          <View
            style={
              [
                styles.card,
                { backgroundColor: isDark ? "#1e1e1e" : "#fff", shadowOpacity: isDark ? 0 : 0.1 },
              ] as StyleProp<ViewStyle>
            }
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

          const changeColor = change && change > 0 ? "#1db954" : change && change < 0 ? "#e53935" : "#666"; return (
            <View
              key={coin}
              style={
                [
                  styles.cardRow,
                  { backgroundColor: isDark ? "#1e1e1e" : "#fff", shadowOpacity: isDark ? 0 : 0.1 },
                ] as StyleProp<ViewStyle>
              }
            >
              {/* ستون 1: لوگو + اسم */}
              <View style={styles.coinInfo}>
                <Image
                  source={{ uri: getCoinLogo(coin) }}
                  style={styles.coinLogo}
                  defaultSource={{ uri: "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png" }}
                />
                <Text style={[styles.symbol, { color: textColor }]}>{coin.toUpperCase()}</Text>
              </View>

              {/* ستون 2: قیمت دلار + تغییر */}
              <View style={styles.centerCol}>
                <Text style={[styles.price, { color: textColor }]}>
                  {Number(usdtPrice).toLocaleString()} USDT
                </Text>
                <Text style={[styles.change, { color: changeColor }]}>
                  {change !== undefined && change !== null ? change.toFixed(2) + "%" : "—"}
                </Text>
              </View>

              {/* ستون 3: قیمت تومان */}
              <View style={styles.rightCol}>
                <Text style={[styles.price, { color: textColor }]}>
                  {usdtToToman ? Math.round(usdtPrice * usdtToToman).toLocaleString() + " تومان" : "—"}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* دکمه حالت شب/روز */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.fab,
          { backgroundColor: isDark ? "#1f2937" : "#fff", borderColor: isDark ? "#334155" : "#e5e7eb" },
        ] as StyleProp<ViewStyle>}
      >
        <Text style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</Text>
      </TouchableOpacity>

      {/* Checker */}
      <UpdateChecker />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  coinInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  coinLogo: { width: 36, height: 36, marginRight: 8, borderRadius: 18 },
  centerCol: { flex: 1, alignItems: "center" },
  rightCol: { flex: 1, alignItems: "flex-end" },
  symbol: { fontSize: 16, fontWeight: "700" },
  price: { fontSize: 14 },
  change: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  scrollContent: { paddingVertical: 12, paddingBottom: 160 },
});

export default App;