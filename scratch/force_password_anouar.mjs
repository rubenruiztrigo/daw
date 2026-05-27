import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyzeibgevjvtknhfiywy.supabase.co/';
const serviceRoleKey = 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const userId = '17ee1593-22a4-45a2-a7ed-d321c5b8cb6b';
  console.log(`Setting password for Anouar (${userId}) to "123456"...`);

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: '123456',
    email_confirm: true
  });

  if (error) {
    console.error('Error updating password:', error.message);
  } else {
    console.log('Password updated successfully!');
  }
}

run();
