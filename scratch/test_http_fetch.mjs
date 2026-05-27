async function run() {
  const url = 'https://fyzeibgevjvtknhfiywy.supabase.co/rest/v1/badges?select=*';
  const anonKey = 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF';
  
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  const data = await response.json();
  console.log('Data:', data);
}

run();
