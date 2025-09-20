import { useEffect, useState } from "react";
import * as Updates from "expo-updates";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function UpdateChecker() {
    const [isChecking, setIsChecking] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

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
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.text}>در حال بروزرسانی نسخه جدید، لطفاً اپ را نبندید...</Text>
            </View>
        );
    }

    return null; // وقتی آپدیتی نبود، هیچ چیزی نشون نده
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        textAlign: "center",
        color: "#333",
    },
});