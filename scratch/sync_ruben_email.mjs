import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixEmail() {
  const userId = 'fefd0f25-d1ad-408c-a749-59eb0d554641';
  console.log(`Corrigiendo discrepancia de correo en GoTrue para el usuario ${userId}...`);

  // Actualizamos el correo a ruben.ruiz@gmail.com (con una sola 'e') para alinearlo con la tabla profiles
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: 'ruben.ruiz@gmail.com',
    email_confirm: true,
    user_metadata: {
      email: 'ruben.ruiz@gmail.com',
      username: 'ruben'
    }
  });

  if (error) {
    console.error('Error al alinear el correo en GoTrue:', error);
  } else {
    console.log('¡Correo interno actualizado exitosamente a ruben.ruiz@gmail.com!');
    console.log('Ahora GoTrue y la tabla perfiles coinciden al 100%.');
  }
}

fixEmail();
