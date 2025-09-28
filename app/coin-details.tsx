import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./languageContext";
import { translations } from "./translations";
import TradingViewChart from "../components/TradingviewChart";

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
};

export default function CoinDetailsScreen() {
  const { coinId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { isPersian } = useLanguage();
  const t = isPersian ? translations.fa : translations.en;

  const [coinData, setCoinData] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = isDark ? "#121212" : "#F9FAFB";
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const cardColor = isDark ? "#1E1E1E" : "#FFFFFF";

  useEffect(() => {
    fetchCoinDetails(false);

    const interval = setInterval(() => fetchCoinDetails(true), 30000);
    return () => clearInterval(interval);
  }, [coinId]);

  const fetchCoinDetails = async (isBackground = false) => {
    try {
      if (!isBackground && !refreshing) setLoading(true);

      // مرحله ۱: خوندن کش
      const cached = await AsyncStorage.getItem(`coin - ${ coinId }`);
      if (cached && !isBackground && !refreshing) {
        setCoinData(JSON.parse(cached));
        setLoading(false);
      }

      // مرحله ۲: درخواست API
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false
      `);
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
      };

      // مرحله ۳: ذخیره در کش
      await AsyncStorage.setItem(`coin - ${ coinId }`, JSON.stringify(coin));

      setCoinData(coin);
    } catch (error) {
      console.error("Error fetching coin details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoinDetails(true);
  };

  const openFullChart = () => {
    const getBinanceSymbol = (coinId: string) => {
      const symbolMap: Record<string, string> = {
        bitcoin: "BTCUSDT",
        ethereum: "ETHUSDT",
        binancecoin: "BNBUSDT",
        ripple: "XRPUSDT",
        dogecoin: "DOGEUSDT",
        solana: "SOLUSDT",
        cardano: "ADAUSDT",
        tron: "TRXUSDT",
        polkadot: "DOTUSDT",
        "matic-network": "MATICUSDT",
        stellar: "XLMUSDT",
        litecoin: "LTCUSDT",
        uniswap: "UNIUSDT",
        chainlink: "LINKUSDT",
        "bitcoin-cash": "BCHUSDT",
        monero: "XMRUSDT",
        "ethereum-classic": "ETCUSDT",
        tezos: "XTZUSDT",
        eos: "EOSUSDT",
        aave: "AAVEUSDT",
        compound: "COMPUSDT",
        synthetix: "SNXUSDT",
        "yearn-finance": "YFIUSDT",
        usdt: "USDTUSDT",
      };
      return symbolMap[coinId] || coinId.toUpperCase() + "USDT";
    }; const symbol = getBinanceSymbol(String(coinId));
    const url = "https://www.tradingview.com/chart/?symbol=BINANCE:" + symbol;
    Linking.openURL(url);
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
        {/* کارت بالایی (قیمت) */}
        <View
          style={[styles.headerCard, { backgroundColor: changeBackgroundColor }]}
        >
          <Text style={[styles.coinName, { color: textColor }]}>
            {t.coinNames?.[coinId as string] || coinData.name}
          </Text>
          <Text style={[styles.price, { color: textColor }]}>
            {"$" +
              coinData.price.toLocaleString(isPersian ? "fa-IR" : "en-US")}
          </Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {(coinData.change24h >= 0 ? "+" : "") + coinData.change24h + "%"}
          </Text>
        </View>

        {/* چارت */}
        <View style={[styles.chartContainer, { backgroundColor: cardColor }]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>
            {t.liveChart}
          </Text>
          <TradingViewChart symbol={String(coinId)} height={450} />
        </View>

        {/* آمارهای بازار */}
        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t.marketStats}
          </Text>
          <StatRow
            label={t.high24h}
            value={"$" + coinData.high24h.toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.low24h}
            value={"$" + coinData.low24h.toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.volume24h}
            value={"$" + coinData.volume.toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.marketCap}
            value={"$" + coinData.marketCap.toLocaleString()}
            color={textColor}
          />
        </View>

        {/* اطلاعات عرضه */}
        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t.supplyInfo}
          </Text>
          <StatRow
            label={t.circulatingSupply}
            value={coinData.circulatingSupply.toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.totalSupply}
            value={coinData.totalSupply.toLocaleString()}
            color={textColor}
          />
          <StatRow
            label={t.maxSupply}
            value={coinData.maxSupply.toLocaleString()}
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
); const styles = StyleSheet.create({
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
    fontWeight: "bold",
    marginBottom: 4,
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
});