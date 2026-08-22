import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wwcyfdpwpaxtecymfmxh.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_UWE4gYk8OB751lC2YrO8qQ_Gtra6zqA';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseHealth = async () => {
  try {
    const { data, error } = await supabaseServer.from('users').select('count', { count: 'exact', head: true });
    return {
      connected: true,
      url: supabaseUrl,
      status: 'active'
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
};
