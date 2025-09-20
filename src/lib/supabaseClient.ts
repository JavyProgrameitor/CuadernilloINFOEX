// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Si no hay credenciales, devolvemos un cliente "nulo"
export const hasSupabase = Boolean(url && key);

const supabase = hasSupabase ? createClient(url, key) : (null as any);

export default supabase;
