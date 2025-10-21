import { useEffect, useState } from "react";
import * as Updates from "expo-updates";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLanguage } from './languageContext';
import translations from './translations';

export default function UpdateChecker() {
    const [isChecking, setIsChecking] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { isPersian } = useLanguage();
    const t = isPersian ? translations.fa : translations.en;

    useEffect(() => {
        async function checkForUpdates() {
            try {
                // چک کردن برای آپدیت
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    setIsUpdating(true);
                    // شروع دانلود آپدیت
                    await Updates.fetchUpdateAsync();
                    // بعد از دانلود → ریستارت برنامه
                    await Updates.reloadAsync();
                }
            } catch (e) {
                console.log("خطا در بروزرسانی:", e);
            } finally {
                setIsChecking(false);
            }
        }

        checkForUpdates();
    }, []);

    if (isUpdating) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.text}>{t.updatingMessage}</Text>
            </View>
        );
    }

    return null; // وقتی آپدیتی نبود، هیچ چیزی نشون نده
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '8%',            // یا هر ارتفاعی که خواستی، مثلاً 5–10%
        backgroundColor: '#fff', // یا هر رنگ دلخواه (مثلاً '#121212' برای تیره)
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#c41919ff',
        zIndex: 9999,            // تا روی بقیه عناصر باشه
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        textAlign: "center",
        color: "#14830aff",
    },
});