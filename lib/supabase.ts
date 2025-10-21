import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ebazwxfeygfhklspsqlc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYXp3eGZleWdmaGtsc3BzcWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MzYxNDYsImV4cCI6MjA3NjQxMjE0Nn0.-xCHHWH57GENpcyYfEpL0tEW-DtIIs9UFbHoFipO-Hk'

// Create a custom storage adapter that safely uses AsyncStorage
const customStorage = {
    getItem: (key: string) => {
        // Check if window is defined (we are in a browser environment)
        if (typeof window !== 'undefined') {
            return AsyncStorage.getItem(key)
        }
        // Return a mock for server-side environments
        return Promise.resolve(null)
    },
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
            return AsyncStorage.setItem(key, value)
        }
        return Promise.resolve()
    },
    removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
            return AsyncStorage.removeItem(key)
        }
        return Promise.resolve()
    },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
})