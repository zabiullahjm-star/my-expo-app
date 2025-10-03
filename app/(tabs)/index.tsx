// index.tsx (نسخه اصلاح شده فقط با بهبودهای ضروری)
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
import { useLanguage } from "../languageContext";
import translations from "../translations";
import { useRouter } from "expo-router";

type PriceRecord = {
  usd?: number;
  usd_24h_change?: number;
};

const COINS: string[] = [
  "usdt", "bitcoin", "ethereum", "binancecoin", "ripple", "dogecoin", "solana",
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
  const { isPersian } = useLanguage();
  const router = useRouter();

  // تعریف متغیرهای رنگی بر اساس تم
  const backgroundColor = isDark ? "#0f172a" : "#f8fafc";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const cardBackgroundColor = isDark ? "#1e293b" : "#ffffff";
  const searchBackgroundColor = isDark ? "#334155" : "#e2e8f0";
  const searchTextColor = isDark ? "#f1f5f9" : "#1e293b";
  const placeholderColor = isDark ? "#94a3b8" : "#64748b";
  const placeholderLogoBg = isDark ? "#475569" : "#cbd5e1";
  const placeholderLogoText = isDark ? "#94a3b8" : "#475569";

  // تعریف t از translations
  const t = isPersian ? translations.fa : translations.en;

  const [prices, setPrices] = useState<Record<string, PriceRecord>>({});
  const [coinImages, setCoinImages] = useState<Record<string, string>>({});
  const [usdtToToman, setUsdtToToman] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [offline, setOffline] = useState(false);

  // تعریف displayCoins برای فیلتر کردن
  const displayCoins = COINS.filter(coin => {
    if (searchQuery === "") return true;
    const query = searchQuery.toLowerCase();
    const coinId = coin.toLowerCase();
    const coinName = t.coinNames && t.coinNames[coin]?.toLowerCase();
    return coinId.includes(query) || (coinName && coinName.includes(query));
  });

  // بارگذاری کش اولیه - بهبود یافته برای جلوگیری از صفر شدن
  useEffect(() => {
    (async () => {
      try {
        const [cachedPrices, cachedImages, cachedUsdt] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PRICES),
          AsyncStorage.getItem(STORAGE_KEYS.IMAGES),
          AsyncStorage.getItem(STORAGE_KEYS.USDT),
        ]);

        // فقط اگر داده معتبر داریم، ست می‌کنیم
        if (cachedPrices) {
          const parsedPrices = JSON.parse(cachedPrices);
          if (Object.keys(parsedPrices).length > 0) {
            setPrices(parsedPrices);
          }
        }

        if (cachedImages) {
          const parsedImages = JSON.parse(cachedImages);
          if (Object.keys(parsedImages).length > 0) {
            setCoinImages(parsedImages);
          }
        }

        if (cachedUsdt) {
          const usdtValue = parseFloat(cachedUsdt);
          if (!isNaN(usdtValue) && usdtValue > 0) {
            setUsdtToToman(usdtValue);
          }
        }
      } catch (error) {
        console.log("Error loading cache:", error);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // دریافت دیتا جدید و آپدیت کش فقط در صورت موفقیت - بهبود یافته
  const fetchCryptoPrices = useCallback(async () => {
    try {
      setOffline(false);
      const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS.join(",") + "&vs_currencies=usd&include_24hr_change=true";
      const res = await fetch(url);

      if (!res.ok) throw new Error("API response not ok");

      const data = (await res.json()) as Record<string, PriceRecord>;

      // فقط اگر داده معتبر گرفتیم، آپدیت می‌کنیم
      if (data && Object.keys(data).length > 0) {
        setPrices(data);
        await AsyncStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(data));
      }
    } catch (err) {
      setOffline(true);
      // کش قدیمی حفظ می‌شه
    }
  }, []);

  const fetchCoinImages = useCallback(async () => {
    try {
      setOffline(false);
      const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + COINS.join(",") + "&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h");
      const data = await response.json();
      if (Array.isArray(data)) {
        const images: Record<string, string> = {};
        data.forEach((coin: any) => {
          if (coin?.id && coin?.image) {
            images[coin.id] = coin.image;
          }
        });
        if (Object.keys(images).length > 0) {
          setCoinImages(images);
          await AsyncStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        }
      }
    } catch (error) {
      setOffline(true);
    }
  }, []);

  const fetchUSDTtoToman = useCallback(async () => {
    try {
      setOffline(false);
      const res = await fetch("https://api.wallex.ir/v1/markets");
      const data = await res.json();
      const usdt = data?.result?.symbols?.["USDTTMN"];
      if (usdt && usdt.stats && usdt.stats.lastPrice) {
        const val = parseFloat(usdt.stats.lastPrice);
        if (!isNaN(val) && val > 0) {
          setUsdtToToman(val);
          await AsyncStorage.setItem(STORAGE_KEYS.USDT, val.toString());
        }
      }
    } catch (err) {
      setOffline(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    await Promise.allSettled([
      fetchCryptoPrices(),
      fetchCoinImages(),
      fetchUSDTtoToman()
    ]);
  }, [fetchCryptoPrices, fetchCoinImages, fetchUSDTtoToman]);

  // آپدیت دیتا هر ۳۰ ثانیه
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
  } if (offline) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: "orange", marginBottom: 10, textAlign: "center" }}>
          You are offline, price can't be up to date.
        </Text>
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
            const coinData = prices[coin] || (isUSDT ? { usd: 1, usd_24h_change: 0 } : null);
            const usdtPrice = coinData?.usd;
            const change = coinData?.usd_24h_change;
            const changeColor = change && change > 0 ? "#1db954" : change && change < 0 ? "#e53935" : "#666";
            return (
              <TouchableOpacity
                key={coin}
                onPress={() => router.push(`/coin-details?coinId=${coin}`)}
              >
                <View
                  style={[
                    styles.cardRow,
                    {
                      backgroundColor: cardBackgroundColor,
                      shadowOpacity: isDark ? 0 : 0.1,
                      borderWidth: 1,
                      borderColor: change && change > 0 ?
                        (isDark ? "#4db872ff" : "#4CAF50") :
                        change && change < 0 ?
                          (isDark ? "#ec706ee3" : "#e74b3fff") :
                          "transparent",
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
                      {usdtPrice ? (usdtPrice < 0.001 ? usdtPrice.toFixed(8) : Number(usdtPrice).toLocaleString(isPersian ? 'fa-IR' : 'en-US')) : "۰"}
                    </Text>
                    <Text style={[styles.change, { color: changeColor }]}>
                      {change !== undefined && change !== null ? change.toFixed(2) + "%" : "۰%"}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={[styles.price, { color: textColor }]}>
                      {usdtPrice && usdtToToman ? (usdtPrice < 0.001 ? (usdtPrice * usdtToToman).toFixed(0) + " تومان" : Math.round(usdtPrice * usdtToToman).toLocaleString(isPersian ? 'fa-IR' : 'en-US')) : "۰ تومان"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.searchContainer, { backgroundColor: searchBackgroundColor }]}>
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
          <Text style={[styles.headerText, { color: textColor }]}>{t.coinName}</Text></View>
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
          const coinData = prices[coin] || (isUSDT ? { usd: 1, usd_24h_change: 0 } : null);
          const usdtPrice = coinData?.usd;
          const change = coinData?.usd_24h_change;
          const changeColor = change && change > 0 ? "#1db954" : change && change < 0 ? "#e53935" : "#666";

          return (
            <TouchableOpacity
              key={coin}
              onPress={() => router.push(`/coin-details?coinId=${coin}`)}
            >
              <View
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: cardBackgroundColor,
                    shadowOpacity: isDark ? 0 : 0.1,
                    borderWidth: 1,
                    borderColor: change && change > 0 ?
                      (isDark ? "#4db872ff" : "#4CAF50") :
                      change && change < 0 ?
                        (isDark ? "#ec706ee3" : "#e74b3fff") :
                        "transparent",
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
                    {t.coinNames && coin in t.coinNames ? t.coinNames[coin] : coin.toUpperCase()}
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
            </TouchableOpacity>
          );
        })}

        {displayCoins.length === 0 && searchQuery !== "" && (
          <View style={styles.noResults}>
            <Text style={[styles.noResultsText, { color: textColor }]}>
              {t.noResults} "{searchQuery}" {t.notFound}
            </Text>
          </View>
        )}
      </ScrollView>

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
};

const styles = StyleSheet.create({
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
    borderWidth: 1,
    borderColor: "transparent"
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