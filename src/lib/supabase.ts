import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For demo/development without Supabase connection
export const isDemoMode = !supabaseUrl || supabaseUrl === 'your_supabase_url';

// Create supabase client only if we have valid credentials
let supabase: SupabaseClient | null = null;

if (!isDemoMode && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
