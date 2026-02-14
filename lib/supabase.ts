
import { createClient } from '@supabase/supabase-js';

const getSafeEnv = (key: string): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || 
           (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_[key]) || 
           '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL') || getSafeEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY') || getSafeEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const isSupabaseConfigured = () => {
  const url = getSafeEnv('VITE_SUPABASE_URL') || getSafeEnv('SUPABASE_URL');
  const key = getSafeEnv('VITE_SUPABASE_ANON_KEY') || getSafeEnv('SUPABASE_ANON_KEY');
  return !!url && !!key && !url.includes('placeholder') && url !== 'https://placeholder.supabase.co';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UUID Válido para o modo demo para evitar erros de tipo UUID no Postgres
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export const getDemoProfile = (email?: string, name?: string) => ({
  id: DEMO_USER_ID,
  full_name: name || 'Edson Pereira',
  email: email || 'Edsonpereira30110@gmail.com',
  role: 'admin' as const,
  created_at: new Date().toISOString()
});
