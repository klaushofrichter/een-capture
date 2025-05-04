import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import process from 'process'
import { APP_NAME, APP_DESCRIPTION } from './src/constants.js'
import cookie from 'cookie'
import { Buffer } from 'buffer'

// In-memory store for refresh tokens (dev only)
const tokenStore = new Map()
const REFRESH_TOKEN_EXPIRATION = 24 * 60 * 60 // 24 hours in seconds

// --- Helper function for /proxy/getAccessToken logic ---
async function handleGetAccessToken(req, res, env) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  console.log(`[Vite Middleware] Handling ${req.method} ${url.pathname}`)
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies.session_id; // Define sessionId here

  const code = url.searchParams.get('code');
  const redirectUri = url.searchParams.get('redirect_uri');

  // ... (check sessionId, storedData, env vars) ...

  // Define formData here so it's accessible in logging before try
  const tokenFormData = new URLSearchParams();
  tokenFormData.append('grant_type', 'authorization_code');
  tokenFormData.append('code', code);
  tokenFormData.append('scope', 'vms.all');
  tokenFormData.append('redirect_uri', redirectUri);

  let tokenResponse; // Declare outside try block
  try {
    console.log(`[Vite Middleware] Fetching token from EEN...`);
    console.log(`[Vite Middleware] Auth Header: Basic ${Buffer.from(`${env.VITE_EEN_CLIENT_ID}:******`).toString('base64').substring(0, 10)}...`); // Log partial header
    console.log(`[Vite Middleware] Body Params: ${tokenFormData.toString()}`);

    tokenResponse = await fetch('https://auth.eagleeyenetworks.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${env.VITE_EEN_CLIENT_ID}:${env.VITE_EEN_CLIENT_SECRET}`).toString('base64')}`
        },
        body: tokenFormData
    });
    console.log(`[Vite Middleware] EEN Response Status: ${tokenResponse.status}`);

    // --- Explicit error handling for EEN fetch failure ---
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text(); // Read as text first
      const statusCode = tokenResponse.status || 502;
      console.error(`[Vite Middleware] EEN Token Error: ${statusCode}. Response Body: ${errorText}`); // Log the HTML/text
      if (!res.headersSent) {
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to exchange token with EEN', details: `Status ${statusCode}` })); // Avoid sending potentially large HTML back
      }
      return; // Stop processing
    }
    // --- End explicit error handling ---

    // If response is OK, THEN parse as JSON
    const tokens = await tokenResponse.json();

    // Handle invalid token structure
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_in) {
       console.error('[Vite Middleware] Incomplete tokens received from EEN:', tokens);
       // Send 500 if token structure is invalid
       if (!res.headersSent) {
           res.writeHead(500, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: 'Invalid token data received from EEN' }));
       }
       return; // Stop processing
    }

    // Define sessionId and responseBody before sending success
    const sessionId = crypto.randomUUID();
    tokenStore.set(sessionId, {
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    });
    console.log(`[Vite Middleware] Stored refresh token for session ${sessionId}`);

    const responseBody = JSON.stringify({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      httpsBaseUrl: tokens.httpsBaseUrl,
      sessionId: sessionId
    });

    res.writeHead(200, { /* ... headers ... */ });
    res.end(responseBody);

  } catch (error) {
    // Catch other errors
    console.error('[Vite Middleware] /getAccessToken Unexpected Error:', error);
    // If we have a response object, try reading text from it in case of JSON parse error
    if (tokenResponse && !res.headersSent) { 
        try {
            const errorBody = await tokenResponse.text();
            console.error('[Vite Middleware] Raw error response body:', errorBody);
        } catch (readError) {
            console.error('[Vite Middleware] Could not read error response body.');
        }
    }
    if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Middleware error during token exchange' }));
    }
  }
}

// --- Helper function for /proxy/refreshAccessToken logic ---
async function handleRefreshAccessToken(req, res, env) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`[Vite Middleware] Handling ${req.method} ${url.pathname}`);

  // Read sessionId from URL query parameter
  const sessionId = url.searchParams.get('sessionId');
  console.log(`[Vite Middleware] Session ID from Query Param: ${sessionId}`);

  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session ID query parameter missing' }));
    return;
  }

  const storedData = tokenStore.get(sessionId); // Use sessionId from query

  if (!storedData || Date.now() > storedData.expiresAt) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session ID is invalid or expired' }));
    return;
  }

  let refreshResponse; // Declare outside try block
  try {
    const refreshTokenFormData = new URLSearchParams();
    refreshTokenFormData.append('grant_type', 'refresh_token');
    refreshTokenFormData.append('refresh_token', storedData.refreshToken);

    console.log(`[Vite Middleware] Refreshing token for session ${sessionId}...`);
    refreshResponse = await fetch('https://auth.eagleeyenetworks.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${env.VITE_EEN_CLIENT_ID}:${env.VITE_EEN_CLIENT_SECRET}`).toString('base64')}`
      },
      body: refreshTokenFormData
    });
    console.log(`[Vite Middleware] EEN Refresh Response Status: ${refreshResponse.status}`);

    // --- Explicit error handling for EEN fetch failure ---
    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text(); // Read as text first
      const statusCode = refreshResponse.status || 502;
      console.error(`[Vite Middleware] EEN Refresh Error: ${statusCode}. Response Body: ${errorText}`); // Log the HTML/text
      tokenStore.delete(sessionId); // Invalidate session on refresh failure
      if (!res.headersSent) {
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to refresh token with EEN', details: `Status ${statusCode}` })); // Avoid sending potentially large HTML back
      }
      return; // Stop processing
    }
    // --- End explicit error handling ---

    // If response is OK, THEN parse as JSON
    const newTokens = await refreshResponse.json();

    // Handle invalid token structure
    if (!newTokens.access_token || !newTokens.refresh_token || !newTokens.expires_in) {
       console.error('[Vite Middleware] Incomplete tokens from EEN refresh:', newTokens);
       tokenStore.delete(sessionId); // Invalidate session
       if (!res.headersSent) {
           res.writeHead(500, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: 'Invalid token data received from EEN refresh' }));
       }
       return; // Stop processing
    }

    // Define responseBody before sending success
    tokenStore.set(sessionId, {
      refreshToken: newTokens.refresh_token,
      expiresAt: Date.now() + (newTokens.expires_in * 1000)
    });
    console.log(`[Vite Middleware] Refreshed token for session ${sessionId}`);

    const responseBody = JSON.stringify({
      accessToken: newTokens.access_token,
      expiresIn: newTokens.expires_in
    });

    res.writeHead(200, { /* ... */ });
    res.end(responseBody);

  } catch (error) {
    // Catch other errors
    console.error('[Vite Middleware] /refreshAccessToken Unexpected Error:', error);
    // If we have a response object, try reading text from it in case of JSON parse error
    if (refreshResponse && !res.headersSent) { 
        try {
            const errorBody = await refreshResponse.text();
            console.error('[Vite Middleware] Raw error response body:', errorBody);
        } catch (readError) {
            console.error('[Vite Middleware] Could not read error response body.');
        }
    }
     if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Middleware error during token refresh' }));
     }
  }
}

// --- Custom Vite Plugin for Local OAuth Proxy ---
function localOauthProxy(env) {
  return {
    name: 'local-oauth-proxy',
    configureServer(server) {
      console.log('[Vite Plugin] Applying local OAuth proxy middleware...');
      server.middlewares.use(async (req, res, next) => {
        let parsedPath = '(parse error)';
        let url;
        try {
          const base = `http://${req.headers.host}`;
          url = new URL(req.url, base);
          parsedPath = url.pathname;
        } catch (e) {
          console.error(`[Vite Middleware] URL Parse Error for req.url: ${req.url}`, e);
          parsedPath = req.url; // Fallback for logging
        }
        console.log(`[Vite Middleware Entry] Method: ${req.method}, URL: ${req.url}, Parsed Path: ${parsedPath}`);

        if (parsedPath === '/proxy/getAccessToken') {
          console.log(`[Vite Middleware] Handling /proxy/getAccessToken`);
          await handleGetAccessToken(req, res, env);
          console.log(`[Vite Middleware] Finished handling /proxy/getAccessToken`);
          return; // Stop processing this request
        }

        if (parsedPath === '/proxy/refreshAccessToken') {
          console.log(`[Vite Middleware] Handling /proxy/refreshAccessToken`);
          await handleRefreshAccessToken(req, res, env);
          console.log(`[Vite Middleware] Finished handling /proxy/refreshAccessToken`);
          return; // Stop processing this request
        }

        // Pass unmatched requests
        console.log(`[Vite Middleware] Passing non-target path: ${parsedPath}`);
        next();
      });
    }
  };
}
// --- End Custom Plugin ---

export default defineConfig(({ command, mode }) => {
  // Load .env variables for the current mode
  const env = loadEnv(mode, process.cwd(), '')

  const config = {
    plugins: [
      vue(),
      localOauthProxy(env)
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3333,
      host: '127.0.0.1',
      proxy: {}, // No proxy rules needed here now
    },
    preview: {
      port: 3333,
      host: '127.0.0.1'
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        // Ensure external dependencies if needed, though likely not for this proxy logic
      }
    },
    define: {
      // Define globals if needed, e.g., from package.json (APP_NAME, etc.)
      // Ensure constants are defined if used elsewhere in config/plugins
    }
    // Remove the template section if it's not actually used
    // template: { ... }
  }

  // Set base path conditionally (keep existing logic)
  if (command === 'build') {
    config.base = '/een-login/'
  } else {
    config.base = '/'
  }

  return config
})
