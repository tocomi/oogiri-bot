import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config'
import { Database } from '../generated/supabase'

let _client: SupabaseClient<Database> | null = null

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!_client) {
    _client = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }
  return _client
}
