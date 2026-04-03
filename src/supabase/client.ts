import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../generated/supabase'

let _client: SupabaseClient<Database> | null = null

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!_client) {
    _client = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
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
