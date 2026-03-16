
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAvatars() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Total profiles:', data.length);
  const externalAvatars = data.filter(u => u.avatar && !u.avatar.startsWith('/img/'));
  
  if (externalAvatars.length === 0) {
    console.log('No external avatars found. All use /img/ or are empty.');
  } else {
    console.log('External avatars found:');
    externalAvatars.forEach(u => {
      console.log(`- User: ${u.name} (ID: ${u.id}) -> Avatar: ${u.avatar}`);
    });
  }
}

inspectAvatars();
