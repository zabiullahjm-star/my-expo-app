import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRef } from 'react'

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any;
    signUp: (email: string, password: string, name: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        // دریافت session فعلی
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // گوش دادن به تغییرات auth
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // تایمر برای ذخیره زمان استفاده - جداگانه
    useEffect(() => {
        if (user) {
            // کاربر لاگین کرده - تایمر رو شروع کن
            setStartTime(Date.now());
            startTimeTracker();
        } else {
            // کاربر خارج شده - تایمر رو متوقف کن
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            // وقتی کامپوننت unmount میشه، تایمر رو پاک کن
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setProfile(data);
            }
        } catch (error) {
            console.log('Error fetching profile:', error);
        }
    };

    const startTimeTracker = () => {
        console.log('the timer start');
        // هر 30 ثانیه این کار رو انجام بده:
        intervalRef.current = setInterval(async () => {
            if (user && startTime) {
                const currentTime = Date.now();
                const sessionTime = currentTime - startTime; // محاسبه زمان گذشته
                await saveUserTime(user.id, sessionTime); // ذخیره زمان
                setStartTime(currentTime); // ریستارت تایمر
            }
        }, 10000) as unknown as NodeJS.Timeout;
    };

    const saveUserTime = async (userId: string, sessionTime: number) => {
        try {
            console.log('saving user time', userId, 'time', sessionTime);
            // زمان کل کاربر رو از دیتابیس بگیر
            const { data, error } = await supabase
                .from('profiles')
                .select('total_time')
                .eq('id', userId)
                .single();
            console.log('last data:', data);

            if (data && !error) {
                // زمان جدید = زمان قدیمی + زمان فعلی
                const newTotalTime = (data.total_time || 0) + sessionTime;// در دیتابیس آپدیت کن
                console.log('new time:', newTotalTime)
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        total_time: newTotalTime,
                        last_seen: new Date().toISOString()
                    })
                    .eq('id', userId);

                if (!updateError) {
                    console.log('✅ data saved', newTotalTime);
                }
            }
        } catch (error) {
            console.log('eror saving data:', error);
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            console.log('🚀 Starting signup for:', email);

            // 1. Sign up in authentication system
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                console.log('❌ Auth signup error:', error.message);
                return { data: null, error };
            }

            console.log('✅ User created in auth:', data.user?.id);

            // 2. If user created, create profile
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            name: name.trim(),
                            email: email.trim(),
                            total_time: 0,
                            sessions: 1,
                        }
                    ]);

                if (profileError) {
                    console.log('❌ Profile creation error:', profileError.message);
                    // Even if profile fails, user is registered
                } else {
                    console.log('✅ Profile created successfully');
                }
            }

            return { data, error: null };
        } catch (error: any) {
            console.log('💥 General signup error:', error.message);
            return { data: null, error };
        }
    };
    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // آپدیت sessions
                await supabase
                    .from('profiles')
                    .update({
                        sessions: (profile?.sessions || 0) + 1,
                        last_seen: new Date().toISOString()
                    })
                    .eq('id', data.user.id);
            }

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.log('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            profile,
            signUp,
            signIn,
            signOut,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}