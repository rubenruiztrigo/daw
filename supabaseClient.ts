
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
