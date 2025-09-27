import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

interface TradingViewChartProps {
    symbol: string;
    height?: number;
}

export default function TradingViewChart({ symbol, height = 400 }: TradingViewChartProps) {
    const tradingViewSymbol = 'BINANCE:' + symbol.toUpperCase() + 'USDT';

    const htmlContent = '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>' +
        '</head>' +
        '<body>' +
        '    <div id="tradingview_chart" style="height: 100%; width: 100%;"></div>' +
        '    <script type="text/javascript">' +
        '        new TradingView.widget({' +
        '            "autosize": true,' +
        '            "symbol": "' + tradingViewSymbol + '",' +
        '            "interval": "60",' +
        '            "timezone": "Asia/Tehran",' +
        '            "theme": "dark",' +
        '            "style": "1",' +
        '            "locale": "en",' +
        '            "toolbar_bg": "#f1f3f6",' +
        '            "enable_publishing": false,' +
        '            "hide_top_toolbar": false,' +
        '            "hide_legend": false,' +
        '            "save_image": false,' +
        '            "container_id": "tradingview_chart"' +
        '        });' +
        '    </script>' +
        '</body>' +
        '</html>';

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width - 32,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 10,
    },
    webview: {
        flex: 1,
    },
});