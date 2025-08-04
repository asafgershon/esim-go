import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cleanEnv, str } from "envalid";
import { type Database } from "./generated/database.types";

const env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
});

let supabase: SupabaseClient;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return supabase;
}
