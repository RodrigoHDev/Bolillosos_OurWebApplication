/*
Title: authClient.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Creation of a Supabase client used only to validate the login.
A new client is created on every login and the session is not kept, so the
shared client (supabase.js) always queries with the SUPABASE_KEY.
If the shared client signs in, every later query of the server travels with
the token of that user (role authenticated) and RLS starts hiding rows.
*/

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const createAuthClient = function createAuthClient() {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            //Node 20 (Render) has no native WebSocket: without it the client throws
            realtime: {
                transport: ws
            }
        }
    );
};

module.exports = createAuthClient;
