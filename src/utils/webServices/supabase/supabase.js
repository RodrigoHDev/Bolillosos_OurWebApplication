/*
Title: supabase.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Creation of the supabase object that allows to access the created project in Supabase thanks to the API_KEY and URL
*/

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        realtime: {
            transport: ws
        }
    }
);

module.exports = supabase;