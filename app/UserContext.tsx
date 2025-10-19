import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type User = {
    id: string;
    name: string;
    totalTime: number;
    sessions: number;
    lastLogin: number;
};

type UserContextType = {
    user: User | null;
    login: (name: string) => void;
    logout: () => void;
    getTotalTime: () => string;
    isLoggedIn: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // بارگذاری کاربر از حافظه
    useEffect(() => {
        loadUserFromStorage();
    }, []);

    // شروع تایمر وقتی کاربر لاگین می‌کند
    useEffect(() => {
        if (user) {
            setStartTime(Date.now());
            startTimeTracker();
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user]);

    const startTimeTracker = () => {
        // هر 30 ثانیه زمان رو ذخیره کن
        intervalRef.current = setInterval(async () => {
            if (user && startTime) {
                const currentTime = Date.now();
                const sessionTime = currentTime - startTime;
                await saveUserTime(user.id, sessionTime);
                setStartTime(currentTime); // ریستارت تایمر
            }
        }, 30000) as unknown as NodeJS.Timeout;
    };

    const loadUserFromStorage = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('current_user');
            if (storedUser) {
                const userData: User = JSON.parse(storedUser);

                // دریافت داده آپدیت شده از سرور
                const { data, error } = await supabase
                    .from('crypto_app_users')
                    .select('*')
                    .eq('user_id', userData.id)
                    .single();

                if (data && !error) {
                    const updatedUser = {
                        ...userData,
                        totalTime: data.total_time || 0,
                        sessions: data.sessions || 1
                    };
                    setUser(updatedUser);
                    await AsyncStorage.setItem('current_user', JSON.stringify(updatedUser));
                } else {
                    // اگر کاربر در سرور نیست، از حافظه محلی استفاده کن
                    setUser(userData);
                }
            }
        } catch (error) {
            console.log('خطا در بارگذاری کاربر:', error);
        }
    };

    const login = async (name: string) => {
        try {
            const newUser: User = {
                id: Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                totalTime: 0,
                sessions: 1,
                lastLogin: Date.now()
            };

            // ذخیره در سرور
            const { error } = await supabase
                .from('crypto_app_users')
                .insert([
                    {
                        user_id: newUser.id,
                        name: newUser.name,
                        total_time: 0,
                        sessions: 1
                    }
                ]);

            if (error) {
                console.log('خطا در ذخیره کاربر:', error);
                return;
            }

            setUser(newUser);
            await AsyncStorage.setItem('current_user', JSON.stringify(newUser));

        } catch (error) {
            console.log('خطا در ورود:', error);
        }
    };

    const logout = async () => {
        try {
            if (user && startTime) {
                const endTime = Date.now();
                const sessionTime = endTime - startTime;
                await saveUserTime(user.id, sessionTime);
            }
        } catch (error) {
            console.log('خطا در ذخیره زمان خروج:', error);
        } finally {
            setUser(null);
            setStartTime(null);
            await AsyncStorage.removeItem('current_user');

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    };

    const saveUserTime = async (userId: string, sessionTime: number) => {
        try {
            // دریافت داده فعلی از سرور
            const { data, error } = await supabase
                .from('crypto_app_users')
                .select('total_time, sessions')
                .eq('user_id', userId)
                .single();

            if (data && !error) {
                const newTotalTime = (data.total_time || 0) + sessionTime;
                const newSessions = (data.sessions || 0) + 1;

                // آپدیت در سرور
                const { error: updateError } = await supabase
                    .from('crypto_app_users')
                    .update({
                        total_time: newTotalTime,
                        sessions: newSessions,
                        last_seen: new Date().toISOString()
                    })
                    .eq('user_id', userId);

                if (!updateError) {
                    // آپدیت state محلی
                    if (user) {
                        const updatedUser = {
                            ...user,
                            totalTime: newTotalTime,
                            sessions: newSessions
                        };
                        setUser(updatedUser);
                        await AsyncStorage.setItem('current_user', JSON.stringify(updatedUser));
                    }
                }
            }
        } catch (error) {
            console.log('خطا در ذخیره زمان:', error);
        }
    };

    const getTotalTime = () => {
        if (!user) return '0 دقیقه';
        const minutes = Math.floor(user.totalTime / 60000);
        if (minutes < 60) {
            return `${ minutes } دقیقه`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${ hours } ساعت و ${ remainingMinutes } دقیقه`;
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            login,
            logout,
            getTotalTime,
            isLoggedIn: !!user
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}