import { useEffect } from 'react';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useGlobalSearchParams();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.log('Auth error:', error);
                router.replace('/login');
                return;
            }

            if (session) {
                // موفقیت‌آمیز
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        };

        handleAuthCallback();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text>در حال تأیید...</Text>
        </View>
    );
}