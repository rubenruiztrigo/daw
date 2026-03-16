
const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

async function checkBadgesSchema() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/badges?select=*&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Range-Unit': 'items',
                'Range': '0-0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Badge Schema Keys:', Object.keys(data[0]));
            console.log('Sample Data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('Table is empty or not accessible.');
        }
    } catch (e) {
        console.error('Error fetching badges schema:', e);
    }
}

checkBadgesSchema();
