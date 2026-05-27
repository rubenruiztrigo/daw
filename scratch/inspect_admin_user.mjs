import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspectUser() {
  const userId = 'fefd0f25-d1ad-408c-a749-59eb0d554641';
  console.log(`Consultando el usuario completo desde GoTrue Admin API para ${userId}...`);

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error al obtener usuario:', error);
  } else {
    console.log(JSON.stringify(data.user, null, 2));
  }
}

inspectUser();
