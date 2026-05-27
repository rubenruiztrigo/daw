import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findUser() {
  console.log('Buscando usuario con username o email que contenga "ruben"...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, last_name, username, email, status')
    .ilike('username', '%ruben%');

  if (error) {
    console.error('Error al consultar perfiles:', error);
  } else {
    console.log('Resultados por username:', data);
  }

  const { data: dataEmail, error: errEmail } = await supabase
    .from('profiles')
    .select('id, name, last_name, username, email, status')
    .ilike('email', '%ruben%');

  if (!errEmail && dataEmail && dataEmail.length > 0) {
    console.log('Resultados por email:', dataEmail);
  }
}

findUser();
