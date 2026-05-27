async function run() {
  const url = 'https://fyzeibgevjvtknhfiywy.supabase.co/rest/v1/';
  const response = await fetch(url, {
    headers: {
      'apikey': 'sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF',
      'Authorization': 'Bearer sb_publishable_of5--OpMVZV1Vr2Ay2ke-g_SlQ1A-IF'
    }
  });
  const openapi = await response.json();
  console.log('Response:', openapi);
}

run();
