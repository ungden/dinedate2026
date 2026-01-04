import { createClient } from '@supabase/supabase-js';

// Prefer env vars, but fallback to known project values so the app doesn't crash in dev/preview.
const FALLBACK_SUPABASE_URL = 'https://cgnbicnayzifjyupweki.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmJpY25heXppZmp5dXB3ZWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDAyMDMsImV4cCI6MjA4MDU3NjIwM30.2vVLug2ifmdb233-JZcoxUQ_Zs6Ehv7ebB0LKBj6PSc';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
const SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Lưu session vào localStorage
    autoRefreshToken: true, // Tự động làm mới token khi hết hạn
    detectSessionInUrl: true,
  },
});