import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';

// Clave de servicio proporcionada por el usuario
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forcePassword() {
  const userId = 'fefd0f25-d1ad-408c-a749-59eb0d554641';
  console.log(`Actualizando contraseña para el usuario ${userId} a "123456"...`);

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: '123456',
    email_confirm: true
  });

  if (error) {
    console.error('Error al actualizar contraseña a través de Admin API:', error);
  } else {
    console.log('¡Contraseña actualizada con éxito por API nativa de Supabase!');
    console.log('Usuario unblockeado y correo confirmado de forma absoluta.');
  }
}

forcePassword();
