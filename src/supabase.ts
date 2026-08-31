const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;

let clientCache: SupabaseClient | null | undefined;

async function getClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  if (clientCache !== undefined) return clientCache;
  const { createClient } = await import('@supabase/supabase-js');
  clientCache = createClient(supabaseUrl, supabaseAnonKey);
  return clientCache;
}

// Eager export for backwards compat — but null until first use if lazy
export const supabase: SupabaseClient | null = null;

export { getClient as getSupabaseClient };
