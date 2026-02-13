
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

const checkAvailability = async () => {
    console.log("Checking availability...");

    // Test Username
    const testUsername = "rubenruiz"; // Known user
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', testUsername)
        .single();

    console.log("Username Check:", { user, error: userError });

    // Test Email (if accessible)
    // Note: This might fail if RLS protects email
    const testEmail = "ruben.ruiz@novagob.org"; // Guessing an email or using a known one if possible
    const { data: emailUser, error: emailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testEmail)
        .maybeSingle();

    console.log("Email Check:", { emailUser, error: emailError });
};

checkAvailability();
