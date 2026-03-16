
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalCleanup() {
  console.log('Starting final avatar cleanup...');
  
  const defaultAvatar = '/img/imagen-por-defecto.png';

  // 1. Clean Dicebear
  console.log('Cleaning Dicebear avatars...');
  const { data: diceData, error: diceError } = await supabase
    .from('profiles')
    .update({ avatar: defaultAvatar })
    .ilike('avatar', '%dicebear%')
    .select();

  if (diceError) console.error('Error cleaning Dicebear:', diceError);
  else console.log(`Cleaned ${diceData?.length || 0} Dicebear profiles.`);

  // 2. Clean Base64
  console.log('Cleaning Base64 avatars...');
  const { data: b64Data, error: b64Error } = await supabase
    .from('profiles')
    .update({ avatar: defaultAvatar })
    .like('avatar', 'data:image%')
    .select();

  if (b64Error) console.error('Error cleaning Base64:', b64Error);
  else console.log(`Cleaned ${b64Data?.length || 0} Base64 profiles.`);

  // 3. Verify
  const { data: verifyData } = await supabase.from('profiles').select('avatar');
  console.log('Verification:');
  const counts = verifyData?.reduce((acc: any, p: any) => {
    const type = p.avatar === defaultAvatar ? 'default' : (p.avatar?.includes('dicebear') ? 'dicebear' : (p.avatar?.startsWith('data:') ? 'base64' : 'other'));
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  console.log('Result counts:', counts);
}

finalCleanup();
