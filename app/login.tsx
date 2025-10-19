import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useAuth } from './auth-context';
import { useTheme } from './ThemeContext';
import { useLanguage } from './languageContext';
import { router } from 'expo-router';

export default function LoginScreen() {
    const { signIn, signUp, loading } = useAuth();
    const { isDark } = useTheme();
    const { isPersian } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    const backgroundColor = isDark ? "#121212" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#000000";
    const cardColor = isDark ? "#1E1E1E" : "#FFFFFF";
    const inputBorderColor = isDark ? "#333" : "#DDD";
    const buttonColor = isDark ? "#BB86FC" : "#007AFF";

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert(
                isPersian ? 'خطا' : 'Error',
                isPersian ? 'ایمیل و رمز عبور الزامی است' : 'Email and password are required'
            );
            return;
        }

        if (isSignUp && !name) {
            Alert.alert(
                isPersian ? 'خطا' : 'Error',
                isPersian ? 'نام الزامی است' : 'Name is required'
            );
            return;
        }

        setAuthLoading(true);

        try {
            let result;
            if (isSignUp) {
                result = await signUp(email, password, name);
            } else {
                result = await signIn(email, password);
            }

            if (result.error) {
                Alert.alert(
                    isPersian ? 'خطا' : 'Error',
                    result.error.message
                );
            } else {
                Alert.alert(
                    isPersian ? 'موفق' : 'Success',
                    isPersian
                        ? isSignUp ? 'ثبت‌نام موفقیت‌آمیز بود' : 'ورود موفقیت‌آمیز بود'
                        : isSignUp ? 'Sign up successful' : 'Login successful',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        } catch (error) {
            Alert.alert(
                isPersian ? 'خطا' : 'Error',
                isPersian ? 'خطایی رخ داد' : 'An error occurred'
            );
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor }]}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: textColor }]}>
                    {isSignUp
                        ? (isPersian ? 'ثبت‌نام' : 'Sign Up')
                        : (isPersian ? 'ورود' : 'Login')
                    }
                </Text>
            </View>

            <View style={styles.form}>
                {isSignUp && (
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: cardColor,
                            color: textColor,
                            borderColor: inputBorderColor
                        }]}
                        placeholder={isPersian ? "نام کامل" : "Full Name"}
                        placeholderTextColor={isDark ? "#888" : "#999"}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                )}

                <TextInput
                    style={[styles.input, {
                        backgroundColor: cardColor,
                        color: textColor,
                        borderColor: inputBorderColor
                    }]}
                    placeholder={isPersian ? "ایمیل" : "Email"}
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: cardColor,
                        color: textColor,
                        borderColor: inputBorderColor
                    }]}
                    placeholder={isPersian ? "رمز عبور" : "Password"}
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                /><TouchableOpacity
                    style={[styles.authButton, { backgroundColor: buttonColor }]}
                    onPress={handleAuth}
                    disabled={authLoading}
                >
                    {authLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isSignUp
                                ? (isPersian ? 'ثبت‌نام' : 'Sign Up')
                                : (isPersian ? 'ورود' : 'Login')
                            }
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setIsSignUp(!isSignUp)}
                >
                    <Text style={[styles.switchText, { color: textColor }]}>
                        {isSignUp
                            ? (isPersian ? 'حساب دارید؟ وارد شوید' : 'Have an account? Sign In')
                            : (isPersian ? 'حساب ندارید؟ ثبت‌نام کنید' : 'Don\'t have an account? Sign Up')
                        }
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    form: {
        marginTop: 20,
    },
    input: {
        borderWidth: 1,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    authButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    switchText: {
        fontSize: 16,
    },
});