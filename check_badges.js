
const supabaseUrl = 'https://lobfoivjtkmewqhunnry.supabase.co';
const supabaseKey = 'sb_publishable_zDbz86NkA466tHkQBpYvbA_KjKaPsJv';

async function checkBadgesSchema() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/badges?select=*&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data = await response.json();
        console.log('Badge Sample:', data[0]);
        if (data[0]) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No badges found in table.');
        }
    } catch (e) {
        console.error('Error fetching badges:', e);
    }
}

checkBadgesSchema();
