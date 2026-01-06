import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values if env vars are missing (Common in preview environments)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgnbicnayzifjyupweki.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmJpY25heXppZmp5dXB3ZWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDAyMDMsImV4cCI6MjA4MDU3NjIwM30.2vVLug2ifmdb233-JZcoxUQ_Zs6Ehv7ebB0LKBj6PSc';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error("Missing Supabase environment variables!");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});