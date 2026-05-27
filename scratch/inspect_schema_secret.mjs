import { createClient } from '@supabase/supabase-js';

const url = 'https://fyzeibgevjvtknhfiywy.supabase.co/rest/v1/';
async function run() {
  const response = await fetch(url, {
    headers: {
      'apikey': 'sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq',
      'Authorization': 'Bearer sb_secret_CYrKfhiYuR_cVNKdMZBf2A_BtTwnsAq'
    }
  });
  const openapi = await response.json();
  const paths = Object.keys(openapi.paths || {});
  const rpcPaths = paths.filter(p => p.startsWith('/rpc/'));
  console.log('RPC Paths:', rpcPaths);
}

run();
