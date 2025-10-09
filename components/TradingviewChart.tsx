import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import translations from '../app/translations'; // مسیر درست رو بذار

const { width } = Dimensions.get('window');

interface TradingViewChartProps {
    symbol: string;
    height?: number;
    language?: 'fa' | 'en';
}

export default function TradingViewChart(props: TradingViewChartProps) {
    const symbolParam = props.symbol;
    const height = props.height || 400;
    const language = props.language || 'fa';
    const locale = language === 'fa' ? 'fa' : 'en';

    const [exchangeIndex, setExchangeIndex] = useState(0);
    const [webviewKey, setWebviewKey] = useState(0);
    const [hasError, setHasError] = useState(false);

    // ------ configuration ------
    // صرافی‌ها (ترتیب تلاش: از اول به بعد)
    const exchanges = ['BINANCE', 'KUCOIN', 'BYBIT', 'GATEIO', 'OKX'];

    // مپ نام کوین‌ها به سیمبل (کلیدها lowercase)
    var symbolMap: { [key: string]: string } = {
        'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB', 'ripple': 'XRP',
        'dogecoin': 'DOGE', 'solana': 'SOL', 'cardano': 'ADA', 'tron': 'TRX',
        'polkadot': 'DOT', 'matic-network': 'MATIC', 'hyperliquid': 'HYPE',
        'sui': 'SUI', 'stellar': 'XLM', 'cosmos': 'ATOM', 'litecoin': 'LTC',
        'uniswap': 'UNI', 'monero': 'XMR', 'aave': 'AAVE', 'pepe': 'PEPE', 'fartcoin': 'FARTCOIN'
    };

    // کوین‌هایی که نیاز به .P دارند (هر وقت خواستی اضافه کن)
    var pointPSymbols = ['BTC', 'ETH', 'SOL', 'PEPE'];

    // ------ prepare coin symbol ------
    var coinSymbol = (symbolMap[symbolParam.toLowerCase()] ||
        symbolParam.replace(/[^a-z0-9]/gi, '').toUpperCase());

    // helper: build final symbol for a given exchange
    var buildSymbolForExchange = function (exch: string) {
        var s = exch + ':' + coinSymbol + 'USDT';
        if (pointPSymbols.indexOf(coinSymbol) !== -1) s = s + '.P';
        return s;
    };

    // current finalSymbol (based on exchangeIndex)
    var finalSymbol = buildSymbolForExchange(exchanges[exchangeIndex]);

    // ------ injected JS to detect "no data" in the TradingView widget DOM ------
    // (دقت کن از backtick استفاده نشده)
    var injectedJS =
        "(function() {" +
        "  function checkNoData() {" +
        "    var bodyText = (document.body && document.body.innerText) || '';" +
        // عبارت‌های محتمل خطا/بدون داده را اینجا چک می‌کنیم (می‌توان افزدونش کرد)
        "    if (/no data|no chart data|no prices to display|no prices|No data|No chart data|بدون داده/i.test(bodyText)) {" +
        "      window.ReactNativeWebView.postMessage('NO_DATA');" +
        "    } else {" +
        "      window.ReactNativeWebView.postMessage('OK');" +
        "    }" +
        "  }" +
        "  try { setTimeout(checkNoData, 4000); } catch(e) { window.ReactNativeWebView.postMessage('OK'); }" +
        "})(); true;";

    // ------ build HTML content (بدون استفاده از template literals) ------
    var htmlContent =
        "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
        "<script type=\"text/javascript\" src=\"https://s3.tradingview.com/tv.js\"></script>" +
        "<style>html, body { height: 100%; margin: 0; padding: 0; background: #000; } #tradingview_chart { height: 100%; width: 100%; }</style>" +
        "</head>" +
        "<body>" +
        "<div id=\"tradingview_chart\"></div>" +
        "<script type=\"text/javascript\">" +
        "  try {" +
        "    new TradingView.widget({" +
        "      autosize: true," +
        "      symbol: \"" + finalSymbol + "\"," + // <-- finalSymbol inserted here
        "      interval: \"60\"," +
        "      timezone: \"Asia/Tehran\"," +
        "      theme: \"dark\"," +
        "      style: \"1\"," +
        "      locale: \"" + locale + "\"," +
        "      toolbar_bg: \"#f1f3f6\"," +
        "      enable_publishing: false," + "      hide_top_toolbar: false," +
        "      hide_legend: false," +
        "      save_image: false," +
        "      container_id: \"tradingview_chart\"" +
        "    });" +
        "  } catch(e) { console.log('TV widget error', e); }" +
        "</script>" +
        "</body>" +
        "</html>";

    // ------ message handler (که از WebView دریافت می‌شه) ------
    var handleMessage = function (event: any) {
        var data = event && event.nativeEvent && event.nativeEvent.data;
        if (!data) return;
        // برای دیباگ لاگ می‌کنیم
        try { console.log('TradingView WebView message:', data, 'exchangeIndex:', exchangeIndex); } catch (e) { /* ignore */ }

        if (data === 'NO_DATA') {
            // اگر هنوز صرافی بعدی داریم → امتحان کن
            if (exchangeIndex < exchanges.length - 1) {
                var next = exchangeIndex + 1;
                setExchangeIndex(next);
                // آپدیت webviewKey برای فورس رندر/ریلود
                setWebviewKey(function (k) { return k + 1; });
                // لاگ کن برای دیباگ
                try { console.log('Fallback to next exchange:', exchanges[next]); } catch (e) { /* ignore */ }
            } else {
                // همه امتحان شدند → ارور نمایش بده
                setHasError(true);
            }
        }
    };

    // نمایش ارور وقتی همه فالبک‌ها امتحان شدند
    if (hasError) {
        return (
            <View style={[styles.container, { height: height, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#fff', fontSize: 16 }}>
                    {language === 'fa' ? 'داده‌ای برای نمایش وجود ندارد' : 'No data available'}
                </Text>
            </View>
        );
    }

    // وقتی exchangeIndex تغییر کنه باید finalSymbol هم آپدیت بشه؛
    // چون ما از متغیر ساده استفاده کردیم، WebView با key جدید ری-ماینت میشه و finalSymbol در رندر بعدی ساخته می‌شه.
    // (React این rerender رو انجام میده)

    return (
        <View style={[styles.container, { height: height }]}>
            <WebView
                key={webviewKey}
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                injectedJavaScript={injectedJS}
                onMessage={handleMessage}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color="#fff" />
                        {/* نمایش اطلاعات دیباگ کوچک: */}
                        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>
                            {language === 'fa' ? ('در حال تلاش: ' + exchanges[exchangeIndex]) : ('Trying: ' + exchanges[exchangeIndex])}
                        </Text>
                    </View>
                )}
                userAgent={"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36"}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginHorizontal: 5,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
    },
});