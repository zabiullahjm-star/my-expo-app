// index.tsx (کد کامل اصلاح شده)
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
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../ThemeContext";
import UpdateChecker from "../UpdateChecker";
import { translations } from "../translations";


type PriceRecord = {
  usd?: number;
  usd_24h_change?: number;
};

const COINS: string[] = [
  "bitcoin", "ethereum", "binancecoin", "ripple", "dogecoin", "solana",
  "cardano", "tron", "polkadot", "matic-network", "hyperliquid", "sui",
  "stellar", "litecoin", "whitebit", "uniswap", "mantle", "monero",
  "ethena", "pepe", "aave", "okb", "memecoin", "near", "bittensor",
  "aptos", "arbitrum", "kaspa", "cosmos", "algorand", "vechain",
  "bonk", "fasttoken", "sky", "filecoin", "optimism",
  "celestia", "render-token", "fartcoin",
];

const STORAGE_KEYS = {
  PRICES: "CACHED_PRICES",
  USDT: "CACHED_USDT",
  IMAGES: "CACHED_IMAGES"
};

const App: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [prices, setPrices] = useState<Record<string, PriceRecord>>({});
  const [coinImages, setCoinImages] = useState<Record<string, string>>({});
  const [usdtToToman, setUsdtToToman] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPersian, setIsPersian] = useState(false);
  const t = isPersian ? translations.fa : translations.en;

  const backgroundColor = isDark ? "#121212" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const cardBackgroundColor = isDark ? "#1e1e1e" : "#fff";
  const searchBackgroundColor = isDark ? "#2d2d2d" : "#f5f5f5";
  const searchTextColor = isDark ? "#fff" : "#000";
  const placeholderColor = isDark ? "#888" : "#666";
  const placeholderLogoBg = isDark ? "#334155" : "#e5e7eb";
  const placeholderLogoText = isDark ? "#f1f5f9" : "#374151";

  const filteredCoins = COINS.filter(coin =>
    coin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // اضافه کردن USDT به اول لیست وقتی جستجو خالی است
  const displayCoins = searchQuery ? filteredCoins : ['usdt', ...filteredCoins];

  const fetchCryptoPrices = useCallback(async () => {
    try {
      const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS.join(",") + "&vs_currencies=usd&include_24hr_change=true";
      const res = await fetch(url);
      const data = (await res.json()) as Record<string, PriceRecord>;
      setPrices(data);
      await AsyncStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(data));
    } catch (err) {
      console.warn("CGk error:", err);
      setError(t.error);
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

  const fetchCoinImages = useCallback(async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + COINS.join(",") + "&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h");
      const data = await response.json();

      if (Array.isArray(data)) {
        const images: Record<string, string> = {};
        data.forEach((coin: any) => {
          if (coin?.id && coin?.image) {
            images[coin.id] = coin.image;
          }
        });

        await AsyncStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images)); setCoinImages(images);
      }
    } catch (error) {
      console.warn("Error fetching coin images:", error);
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.IMAGES);
      if (cached) {
        try {
          setCoinImages(JSON.parse(cached));
        } catch {
          setCoinImages({});
        }
      } else {
        setCoinImages({});
      }
    }
  }, []);

  const loadCachedImages = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.IMAGES);
      if (cached) {
        const images = JSON.parse(cached);
        setCoinImages(images);
      }
    } catch (error) {
      console.warn("Error loading cached images:", error);
    }
  }, []);

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

  const loadData = useCallback(
    async (firstTime = false) => {
      if (firstTime) {
        setInitialLoading(true);
        await loadCachedImages();
      }
      setError(null);
      await Promise.allSettled([
        fetchCryptoPrices(),
        fetchCoinImages(),
        fetchUSDTtoToman()
      ]);
      if (firstTime) setInitialLoading(false);
    },
    [fetchCryptoPrices, fetchCoinImages, fetchUSDTtoToman, loadCachedImages]
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

  const renderCoinLogo = (coinId: string) => {
    const logoUrl = coinImages[coinId];

    if (logoUrl) {
      return (
        <Image
          source={{ uri: logoUrl }}
          style={styles.coinLogo}
          onError={() => {
            const updatedImages = { ...coinImages };
            delete updatedImages[coinId];
            setCoinImages(updatedImages);
          }}
        />
      );
    } else {
      return (
        <View style={[styles.placeholderLogo, { backgroundColor: placeholderLogoBg }]}>
          <Text style={[styles.placeholderText, { color: placeholderLogoText }]}>
            {coinId.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }, styles.center]}>
        <ActivityIndicator size="large" color={textColor} />
        <Text style={{ marginTop: 10, color: textColor }}>{t.loading}</Text>
      </SafeAreaView>
    );
  }

  if (error && Object.keys(prices).length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }, styles.center]}>
        <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={() => loadData(true)}>
          <Text style={{ color: "#2196f3" }}>{t.retry}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}><View style={[styles.searchContainer, { backgroundColor: searchBackgroundColor }]}>
      <TextInput
        style={[styles.searchInput, { color: searchTextColor }]}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={placeholderColor}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery("")}
        >
          <Text style={[styles.clearText, { color: placeholderColor }]}>{"×"}</Text>
        </TouchableOpacity>
      )}
    </View>

      <View style={[styles.columnsHeader, { backgroundColor }]}>
        <View style={styles.coinInfoHeader}>
          <Text style={[styles.headerText, { color: textColor }]}>{t.coinName}</Text>
        </View>
        <View style={styles.centerColHeader}>
          <Text style={[styles.headerText, { color: textColor }]}>{t.usdtPrice}</Text>
        </View>
        <View style={styles.rightColHeader}>
          <Text style={[styles.headerText, { color: textColor }]}>{t.tomanPrice}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayCoins.map((coin) => {
          const isUSDT = coin === 'usdt';
          const coinData = isUSDT ? { usd: 1, usd_24h_change: 0 } : prices[coin];
          const usdtPrice = coinData?.usd;
          const change = coinData?.usd_24h_change;

          const changeColor = change && change > 0 ? "#1db954" : change && change < 0 ? "#e53935" : "#666";

          return (
            <View
              key={coin}
              style={[
                styles.cardRow,
                {
                  backgroundColor: cardBackgroundColor,
                  shadowOpacity: isDark ? 0 : 0.1
                },
              ]}
            >
              <View style={styles.coinInfo}>
                {renderCoinLogo(coin)}
                <Text
                  style={[styles.symbol, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t.coinNames && coin in t.coinNames ? t.coinNames[coin as keyof typeof t.coinNames] : coin.toUpperCase()}
                </Text>
              </View>

              <View style={styles.centerCol}>
                <Text style={[styles.price, { color: textColor }]}>
                  {usdtPrice ? (usdtPrice < 0.001 ? usdtPrice.toFixed(8) : Number(usdtPrice).toLocaleString(isPersian ? 'fa-IR' : 'en-US')) : "—"}
                </Text>
                <Text style={[styles.change, { color: changeColor }]}>
                  {change !== undefined && change !== null ? change.toFixed(2) + "%" : "—"}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.price, { color: textColor }]}>
                  {usdtPrice && usdtToToman ? (usdtPrice < 0.001 ? (usdtPrice * usdtToToman).toFixed(0) + " تومان" : Math.round(usdtPrice * usdtToToman).toLocaleString(isPersian ? 'fa-IR' : 'en-US')) : "—"}
                </Text>
              </View>
            </View>
          );
        })}

        {displayCoins.length === 0 && (
          <View style={styles.noResults}>
            <Text style={[styles.noResultsText, { color: textColor }]}>
              {t.noResults} "{searchQuery}" {t.notFound}
            </Text>
          </View>
        )}
      </ScrollView>
      {/* دکمه تغییر زبان */}
      <TouchableOpacity
        onPress={() => setIsPersian(!isPersian)}
        style={[
          styles.langButton,
          {
            backgroundColor: isDark ? "#072655ff" : "#fff",
            borderColor: isDark ? "#1c477cff" : "#e5e7eb"
          },
        ]}
      >
        <Text style={{ fontSize: 14, color: textColor, fontWeight: 'bold' }}>
          {isPersian ? "EN" : "FA"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.fab,
          {
            backgroundColor: isDark ? "#1f2937" : "#fff",
            borderColor: isDark ? "#334155" : "#e5e7eb"
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</Text>
      </TouchableOpacity>

      <UpdateChecker />
    </SafeAreaView>
  );
}; const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center"
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  columnsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  coinInfoHeader: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  centerColHeader: {
    flex: 1,
    alignItems: 'center',
  },
  rightColHeader: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.2,
  },
  coinLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16
  },
  placeholderLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerCol: {
    flex: 1,
    alignItems: "center"
  },
  rightCol: {
    flex: 1,
    alignItems: "flex-end"
  },
  symbol: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
  },
  change: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
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
  langButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  scrollContent: {
    paddingBottom: 100
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;