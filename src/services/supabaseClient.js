import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://wwcyfdpwpaxtecymfmxh.supabase.co';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UWE4gYk8OB751lC2YrO8qQ_Gtra6zqA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      console.log('Supabase connection info:', error.message);
    }
    return {
      connected: true,
      url: supabaseUrl
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
};
