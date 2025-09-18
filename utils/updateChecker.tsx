import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Linking, StyleSheet } from "react-native";

interface VersionInfo {
    latestVersion: string;
    downloadUrl: string;
    changeLog: string;
    releaseDate: string;
}

const UpdateChecker: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 👇 نسخه فعلی اپلیکیشن (خودت باید دستی تغییر بدی)
    const CURRENT_VERSION = "1.0.0";

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                setLoading(true);
                const res = await fetch("https://zabiullahjm-star.github.io/price-site/version.json");
                const data: VersionInfo = await res.json();

                if (data.latestVersion !== CURRENT_VERSION) {
                    setUpdateInfo(data);
                }
            } catch (err) {
                setError("❌ خطا در بررسی آپدیت");
            } finally {
                setLoading(false);
            }
        };

        checkUpdate();
    }, []);

    if (loading) {
        return (
            <View style={styles.center} >
                <ActivityIndicator size="large" color="blue" />
                <Text>در حال بررسی بروزرسانی...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center} >
                <Text style={{ color: "red" }}> {error} </Text>
            </View>
        );
    }

    if (!updateInfo) {
        return null; // 👈 یعنی آپدیت وجود نداره
    }

    return (
        <View style={styles.updateBox} >
            <Text style={styles.title}>📢 نسخه جدید موجود است! </Text>
            < Text > نسخه: {updateInfo.latestVersion} </Text>
            < Text > تغییرات: {updateInfo.changeLog} </Text>
            < Text > تاریخ انتشار: {updateInfo.releaseDate} </Text>

            < TouchableOpacity
                style={styles.button}
                onPress={() => Linking.openURL(updateInfo.downloadUrl)}
            >
                <Text style={styles.buttonText}> دانلود بروزرسانی </Text>
            </TouchableOpacity>
        </View>
    );
};

export default UpdateChecker;

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    updateBox: {
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        margin: 20,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    button: {
        marginTop: 15,
        backgroundColor: "blue",
        padding: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
    },
});