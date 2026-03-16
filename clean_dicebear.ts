
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanDicebearAvatars() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .like('avatar', '%dicebear%');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  if (data.length === 0) {
    console.log('No profiles found with Dicebear avatars.');
    return;
  }

  console.log(`Found ${data.length} profiles with Dicebear avatars.`);
  
  for (const p of data) {
    console.log(`Updating ${p.name} (${p.id}): ${p.avatar} -> /img/imagen-por-defecto.png`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar: '/img/imagen-por-defecto.png' })
      .eq('id', p.id);
    
    if (updateError) {
      console.error(`Failed to update ${p.name}:`, updateError.message);
    } else {
      console.log(`Successfully updated ${p.name}`);
    }
  }
}

cleanDicebearAvatars();
