import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Intentando iniciar sesión con ruben.ruiz@gmail.com y contraseña "123456"...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ruben.ruiz@gmail.com',
    password: '123456'
  });

  if (error) {
    console.error('ERROR COMPLETO DEVUELTO POR SUPABASE AUTH:');
    console.error(JSON.stringify(error, null, 2));
    console.error('Mensaje:', error.message);
    console.error('Status:', error.status);
  } else {
    console.log('¡Inicio de sesión exitoso por API JS Client!', data.session?.user?.id);
  }
}

testLogin();
