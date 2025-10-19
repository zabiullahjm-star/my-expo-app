import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const signUp = async (email: string, password: string, name: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // ایجاد پروفایل کاربر
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            name: name,
                            email: email,
                            total_time: 0,
                            sessions: 1,
                        }
                    ]);

                if (profileError) throw profileError;
            }

            return { data, error: null };
        } catch (error) {
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