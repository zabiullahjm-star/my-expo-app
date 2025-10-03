import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./languageContext";
import translations from "./translations";
import TradingViewChart from "../components/TradingviewChart";
import { WebView } from "react-native-webview";

type CoinDetails = {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  lastUpdated: number;
};

const STORAGE_KEYS = {
  COIN_DATA: (coinId: string) => `COIN_DATA_${coinId}`,
  CHART_IMAGE: (coinId: string) => `CHART_IMAGE_${coinId}`,
};

export default function CoinDetailsScreen() {
  const { coinId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { isPersian } = useLanguage();
  const t = isPersian ? translations.fa : translations.en;

  const [coinData, setCoinData] = useState<CoinDetails | null>(null);
  const [chartImage, setChartImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [showWebView, setShowWebView] = useState(false);

  const backgroundColor = isDark ? "#121212" : "#F9FAFB";
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const cardColor = isDark ? "#1E1E1E" : "#FFFFFF";

  // بارگذاری کش اولیه
  useEffect(() => {
    loadCachedData();
    const interval = setInterval(() => fetchCoinDetails(true), 30000);
    return () => clearInterval(interval);
  }, [coinId]);

  const loadCachedData = async () => {
    try {
      const [cachedCoinData, cachedChartImage] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.COIN_DATA(String(coinId))),
        AsyncStorage.getItem(STORAGE_KEYS.CHART_IMAGE(String(coinId))),
      ]);

      if (cachedCoinData) {
        const parsedData = JSON.parse(cachedCoinData);
        setCoinData(parsedData);
      }

      if (cachedChartImage) {
        setChartImage(cachedChartImage);
      }
    } catch (error) {
      console.log("Error loading cache:", error);
    } finally {
      setLoading(false);
      fetchCoinDetails(false);
    }
  };

  const fetchCoinDetails = async (isBackground = false) => {
    try {
      setOffline(false);
      if (!isBackground && !refreshing) setLoading(true);

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false
      `);

      if (!res.ok) throw new Error("API response not ok");

      const data = await res.json();

      const coin: CoinDetails = {
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        price: data.market_data.current_price.usd,
        change24h: data.market_data.price_change_percentage_24h,
        high24h: data.market_data.high_24h.usd,
        low24h: data.market_data.low_24h.usd,
        volume: data.market_data.total_volume.usd,
        marketCap: data.market_data.market_cap.usd,
        circulatingSupply: data.market_data.circulating_supply,
        totalSupply: data.market_data.total_supply || 0,
        maxSupply: data.market_data.max_supply || 0,
        lastUpdated: Date.now(),
      };

      // فقط اگر داده معتبر گرفتیم، آپدیت می‌کنیم
      if (coin.price && coin.marketCap) {
        setCoinData(coin);
        await AsyncStorage.setItem(STORAGE_KEYS.COIN_DATA(String(coinId)), JSON.stringify(coin));
      }

      // کش کردن چارت
      await cacheChartImage();

    } catch (error) {
      setOffline(true);
      // کش قدیمی حفظ می‌شه
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }; const cacheChartImage = async () => {
    try {
      // اینجا می‌تونی از TradingView screenshot بگیر یا یه تصویر ثابت ذخیره کنی
      // برای نمونه، یه placeholder ذخیره می‌کنم
      const chartPlaceholder = "chart_placeholder_url"; // جایگزین کن با منطق واقعی
      setChartImage(chartPlaceholder);
      await AsyncStorage.setItem(STORAGE_KEYS.CHART_IMAGE(String(coinId)), chartPlaceholder);
    } catch (error) {
      console.log("Error caching chart image:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoinDetails(true);
  };

  const getBinanceSymbol = (coinId: string) => {
    const symbolMap = t.binanceSymbols || {};
    return symbolMap[coinId] || coinId.toUpperCase() + "USDT";
  };

  const symbol = getBinanceSymbol(String(coinId));
  const chartUrl = "https://www.tradingview.com/chart/?symbol=BINANCE:" + symbol;

  const openFullChart = () => {
    setShowWebView(true);
  };

  // تابع برای نمایش زمان آخرین بروزرسانی
  const getLastUpdatedText = () => {
    if (!coinData?.lastUpdated) return "";

    const now = Date.now();
    const diffInMinutes = Math.floor((now - coinData.lastUpdated) / (1000 * 60));

    if (diffInMinutes < 1) return isPersian ? "هم اکنون" : "Just now";
    if (diffInMinutes < 60) return isPersian ? `${diffInMinutes} دقیقه پیش` : `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    return isPersian ? `${diffInHours} ساعت پیش` : `${diffInHours} hours ago`;
  };

  if (loading && !coinData) {
    return (
      <View style={[styles.container, { backgroundColor }, styles.center]}>
        <ActivityIndicator size="large" color={textColor} />
        <Text style={{ marginTop: 10, color: textColor }}>{t.loading}</Text>
      </View>
    );
  }

  if (!coinData) {
    return (
      <View style={[styles.container, { backgroundColor }, styles.center]}>
        <Text style={{ color: textColor }}>{t.error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={{ color: textColor }}>{t.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const changeColor = coinData.change24h >= 0 ? "#1db954" : "#e53935";
  const changeBackgroundColor =
    coinData.change24h >= 0
      ? isDark
        ? "#1B5E20"
        : "#C8E6C9"
      : isDark
        ? "#B71C1C"
        : "#FFCDD2";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Modal WebView */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ padding: 12, backgroundColor: "#2196F3" }}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                {isPersian ? "بستن" : "Close"}
              </Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ uri: chartUrl }} style={{ flex: 1 }} />
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
      >
        {/* وضعیت آفلاین */}
        {offline && (
          <View style={[styles.offlineBanner, { backgroundColor: "#FFA000" }]}>
            <Text style={styles.offlineText}>
              {isPersian ? "حالت آفلاین - نمایش آخرین داده‌های ذخیره شده" : "Offline - Showing last saved data"}
            </Text>
            <Text style={styles.lastUpdatedText}>
              {getLastUpdatedText()}
            </Text>
          </View>
        )}{/* کارت بالایی (قیمت) */}
        <View
          style={[styles.headerCard, { backgroundColor: changeBackgroundColor }]}
        >
          <Text style={[styles.coinName, { color: textColor }]}>
            {t.coinNames?.[coinId as string] || coinData.name}
          </Text>
          <Text style={[styles.price, { color: textColor }]}>
            {"$" + (coinData.price || 0).toLocaleString(isPersian ? "fa-IR" : "en-US")}
          </Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {(coinData.change24h >= 0 ? "+" : "") + (coinData.change24h || 0).toFixed(2) + "%"}
          </Text>
        </View>

        {/* چارت */}
        <View style={[styles.chartContainer, { backgroundColor: cardColor }]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>
            {t.coinDetails.liveChart}
          </Text>

          {chartImage ? (
            <Image
              source={{ uri: chartImage }}
              style={styles.chartImage}
              resizeMode="contain"
            />
          ) : (
            <TradingViewChart symbol={String(coinId)} height={450} />
          )}

          <TouchableOpacity style={styles.fullChartBtn} onPress={openFullChart}>
            <Text style={{ color: "#2196F3", fontWeight: "bold" }}>
              {t.viewFullChart}
            </Text>
          </TouchableOpacity>
        </View>

        {/* آمارهای بازار */}
        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t.coinDetails.marketStats}
          </Text>
          <StatRow
            label={t.coinDetails.high24h}
            value={"$" + (coinData.high24h || 0).toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.coinDetails.low24h}
            value={"$" + (coinData.low24h || 0).toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.coinDetails.volume24h}
            value={"$" + (coinData.volume || 0).toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.coinDetails.marketCap}
            value={"$" + (coinData.marketCap || 0).toLocaleString()}
            color={textColor}
          />
        </View>

        {/* اطلاعات عرضه */}
        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t.coinDetails.supplyInfo}
          </Text>
          <StatRow
            label={t.coinDetails.circulatingSupply}
            value={(coinData.circulatingSupply || 0).toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.coinDetails.totalSupply}
            value={(coinData.totalSupply || 0).toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.coinDetails.maxSupply}
            value={(coinData.maxSupply || 0).toLocaleString()}
            color={textColor}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const StatRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View style={styles.statRow}>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  coinName: {
    fontSize: 18,
    fontWeight: "bold", marginBottom: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: "bold",
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  chartImage: {
    width: '100%',
    height: 450,
    borderRadius: 8,
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  fullChartBtn: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    alignSelf: "center",
    backgroundColor: "#E3F2FD",
  },
  offlineBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  offlineText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  lastUpdatedText: {
    color: "#000",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
});