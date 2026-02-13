import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for admin tasks usually, but let's try anon if RLS allows or if we have service key

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

// Use Service Role Key if available for admin tasks, otherwise Anon Key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function runSql(filePath: string) {
    console.log(`Applying ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Supabase JS client doesn't have a direct 'run sql' method for arbitrary SQL unless we use the rpc or psql.
    // However, we can use the 'rpc' if we have a function to exec sql, OR we just use the REST API if permitted.
    // Actually, standard Supabase client doesn't support running raw SQL strings from client.
    // We usually need the Postgres connection string and 'pg' library.

    // Check if we have pg installed?
    // If not, we might simpler asking the user to run the SQL in dashboard.
    // But wait, I can try to use a specific function if it exists, or...

    console.log("SQL content:\n", sql);
    console.log("\nNOTE: Since I cannot execute raw SQL directly via standard Supabase Client without a specific setup, please copy the SQL above and run it in your Supabase SQL Editor.");
}

async function main() {
    console.log("Migration steps:");
    console.log("1. add_user_status.sql");
    console.log("2. add_admin_role.sql");

    // I will read and print them, as I cannot safely execute them without 'pg' driver and connection string.
    await runSql(path.join(__dirname, 'add_user_status.sql'));
    await runSql(path.join(__dirname, 'add_admin_role.sql'));
}

main();
