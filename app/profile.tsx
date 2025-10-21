import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from 'react-native';
import { useAuth } from './auth-context';
import { useTheme } from './ThemeContext';
import { useLanguage } from './languageContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const { user, profile, signOut, loading } = useAuth();
    const { isDark } = useTheme();
    const { isPersian } = useLanguage();

    const backgroundColor = isDark ? "#121212" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#000000";
    const cardColor = isDark ? "#1E1E1E" : "#FFFFFF";

    const handleLogin = () => {
        router.push('/login');
    };

    const handleLogout = () => {
        Alert.alert(
            'خروج',
            'آیا مطمئن هستید؟',
            [
                { text: 'لغو', style: 'cancel' },
                {
                    text: 'خروج',
                    onPress: async () => {
                        await signOut();
                        console.log('✅ خروج موفق - ریدایرکت به لاگین');
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const getTotalTime = () => {
        if (!profile?.total_time) return '0 دقیقه';
        const minutes = Math.floor(profile.total_time / 60000);
        if (minutes < 60) {
            return `${minutes} دقیقه`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours} ساعت و ${remainingMinutes} دقیقه`;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <Text style={{ color: textColor }}>{isPersian ? 'در حال بارگذاری...' : 'Loading...'}</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <ScrollView
                style={[styles.container, { backgroundColor }]}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textColor }]}>
                        {isPersian ? 'پروفایل' : 'Profile'}
                    </Text>
                    <Text style={[styles.subtitle, { color: textColor }]}>
                        {isPersian
                            ? 'برای مشاهده آمار استفاده وارد حساب خود شوید'
                            : 'Sign in to view your usage statistics'
                        }
                    </Text>
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.buttonText}>
                        {isPersian ? 'ورود / ثبت‌نام' : 'Sign In / Sign Up'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor }]}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: textColor }]}>
                    {isPersian ? 'پروفایل کاربری' : 'User Profile'}
                </Text>
                <Text style={[styles.welcome, { color: textColor }]}>
                    {isPersian ? 'خوش آمدید' : 'Welcome'}, {profile?.name || user.email}!
                </Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {isPersian ? 'نام:' : 'Name:'}
                    </Text>
                    <Text style={[styles.value, { color: textColor }]}>{profile?.name || '-'}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {isPersian ? 'ایمیل:' : 'Email:'}
                    </Text>
                    <Text style={[styles.value, { color: textColor }]}>{user.email}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {isPersian ? 'مدت زمان استفاده:' : 'Total Usage Time:'}
                    </Text>
                    <Text style={[styles.value, { color: textColor }]}>{getTotalTime()}</Text>
                </View><View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {isPersian ? 'تعداد دفعات استفاده:' : 'Total Sessions:'}
                    </Text>
                    <Text style={[styles.value, { color: textColor }]}>
                        {profile?.sessions || 0} {isPersian ? 'بار' : 'times'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>
                    {isPersian ? 'خروج از حساب' : 'Sign Out'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    welcome: {
        fontSize: 18,
        textAlign: 'center',
        opacity: 0.8,
    },
    statsContainer: {
        marginBottom: 30,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});