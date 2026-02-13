
import { supabase } from './supabaseClient';

const checkUser = async () => {
    console.log("Checking for user 'novagob'...");

    const { data: user, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', 'novagob')
        .maybeSingle();

    if (error) {
        console.error("Error checking user:", error);
    } else if (user) {
        console.log("User found:", user);
    } else {
        console.log("User 'novagob' not found.");
    }
};

checkUser();
