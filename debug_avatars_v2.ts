
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countAvatarTypes() {
  console.log('Querying all profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  let dicebearCount = 0;
  let base64Count = 0;
  let defaultCount = 0;
  let otherCount = 0;
  let nullCount = 0;

  data.forEach(p => {
    const avatar = p.avatar;
    if (!avatar) {
      nullCount++;
    } else if (avatar.includes('dicebear')) {
      dicebearCount++;
      console.log(`DICEBEAR ID: ${p.id} | ${p.username}`);
    } else if (avatar.startsWith('data:image')) {
      base64Count++;
      console.log(`BASE64 ID: ${p.id} | ${p.username}`);
    } else if (avatar === '/img/imagen-por-defecto.png') {
      defaultCount++;
    } else {
      otherCount++;
    }
  });

  console.log('--- Summary ---');
  console.log('Total profiles:', data.length);
  console.log('Default avatar:', defaultCount);
  console.log('Dicebear:', dicebearCount);
  console.log('Base64:', base64Count);
  console.log('Null/Empty:', nullCount);
  console.log('Others:', otherCount);
}

countAvatarTypes();
