
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const userIds = [
  '0792754f-01cb-48a0-88a4-8d66b1feb053',
  '7d2c332f-2f9c-4d52-ba8b-f18c6746fbcb',
  'df147a8b-29f2-422a-85c9-473375884936',
  'f522f589-7f54-457f-b507-790a3847bebc',
  '2a00e3b3-d8c9-4b5c-868f-442b0bfbc512',
  '5260f667-5542-46c1-b4e7-b532c5d60f5b',
  '1668d061-3dcc-4b94-9002-8b50e66eff11'
];

async function updateIndividualAvatars() {
  const defaultAvatar = '/img/imagen-por-defecto.png';
  
  for (const id of userIds) {
    console.log(`Updating user ${id}...`);
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar: defaultAvatar })
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating user ${id}:`, error);
    } else {
      console.log(`Successfully updated user ${id}. New avatar: ${data?.[0]?.avatar}`);
    }
  }
}

updateIndividualAvatars();
