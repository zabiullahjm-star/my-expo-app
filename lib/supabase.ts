import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

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