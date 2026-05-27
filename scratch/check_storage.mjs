import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStorage() {
  console.log('Checking bucket "chat-images"...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
    return;
  }

  const chatImagesBucket = buckets.find(b => b.name === 'chat-images');
  if (chatImagesBucket) {
    console.log('Bucket "chat-images" found:', chatImagesBucket);
  } else {
    console.log('Bucket "chat-images" NOT found.');
    console.log('Existing buckets:', buckets.map(b => b.name));
  }

  // Try a dummy upload
  console.log('Attempting dummy upload...');
  const blob = new Blob(['test'], { type: 'text/plain' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(`test-${Date.now()}.txt`, blob);

  if (uploadError) {
    console.error('Upload error:', uploadError);
  } else {
    console.log('Upload success:', uploadData);
  }
}

checkStorage();
