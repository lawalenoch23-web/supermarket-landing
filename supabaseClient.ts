import { createClient } from '@supabase/supabase-js'

// These are like your digital keys. 
// You get these for free when you sign up at supabase.com
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)