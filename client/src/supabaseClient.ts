import { createClient } from "@supabase/supabase-js";

// These are like your digital keys.
// You get these for free when you sign up at supabase.com
const supabaseUrl = "https://tqlpgeqnbopaomonhrme.supabase.co";
const supabaseAnonKey = "sb_publishable_EdFTM_8qcaf8PoOg-DbZzg_vZ198AVM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
