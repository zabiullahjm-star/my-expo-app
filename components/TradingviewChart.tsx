import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import translations from '../app/translations'; // مسیر درست رو بذار

const { width } = Dimensions.get('window');

interface TradingViewChartProps {
    symbol: string;   // مثلاً "bitcoin", "ethereum", "dogecoin"
    height?: number;
    language?: 'fa' | 'en';
}

export default function TradingViewChart({
    symbol,
    height = 400,
    language = 'fa',
}: TradingViewChartProps) {
    // گرفتن سیمبل درست از مپ binanceSymbols
    const binanceSymbols = translations[language].binanceSymbols;
    // تبدیل نام کوین به نماد
    const getSymbolFromName = (coinName: string) => {
        const symbolMap: { [key: string]: string } = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'binancecoin': 'BNB',
            'ripple': 'XRP',
            'dogecoin': 'DOGE',
            'solana': 'SOL',
            'cardano': 'ADA',
            'tron': 'TRX',
            'polkadot': 'DOT',
            'matic-network': 'MATIC',
            'stellar': 'XLM',
            'litecoin': 'LTC',
            'uniswap': 'UNI',
            'monero': 'XMR',
            'aave': 'AAVE',
            'pepe': 'PEPE',
            'usdt': 'USDT'
        };
        return symbolMap[coinName.toLowerCase()] || 'BTC'; // fallback به بیت‌کوین
    };

    const coinSymbol = getSymbolFromName(symbol);
    const tradingViewSymbol = 'BINANCE:' + coinSymbol + 'USDT';
    console.log('Final TradingView Symbol:', tradingViewSymbol);

    // زبان چارت
    const locale = language === 'fa' ? 'fa' : 'en';

    const htmlContent = `
    < !DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
                    <style>
                        html, body {
                            height: 100%;
                        margin: 0;
                        padding: 0;
                        background: #000;
        }
                        #tradingview_chart {
                            height: 100%;
                        width: 100%;
        }
                    </style>
            </head>
            <body>
                <div id="tradingview_chart"></div>
                <script type="text/javascript">
                    new TradingView.widget({
                        "autosize": true,
                    "symbol": "${tradingViewSymbol}",
                    "interval": "60",
                    "timezone": "Asia/Tehran",
                    "theme": "dark",
                    "style": "1",
                    "locale": "${locale}",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "hide_top_toolbar": false,
                    "hide_legend": false,
                    "save_image": false,
                    "container_id": "tradingview_chart"
        });
                </script>
            </body>
        </html>
        `;

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                source={{ html: htmlContent }}
                style={[styles.webview, { height }]}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                userAgent={
                    ' Chrome/126.0.0.0'
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginHorizontal:5,
        borderRadius: 12,
        overflow: 'hidden',
      
        backgroundColor: '#000'
    },
    webview: {
        flex: 1,
    },
});