// wrangler.toml configuration for environment variables and KV binding

export default {
  // this is the request from the Frontend coming in
  // eslint-disable-next-line no-unused-vars

  // Get version info from KV store
  //const version = await env.EEN_LOGIN.get("DEPLOY_VERSION")
  //console.log('[Vite Plugin] Running version:', version)

  async fetch(request, env, ctx) {
    // console.log('[Cloudflare Plugin] Fetching request'); // Removed
    const origin = request.headers.get('Origin');
    // console.log('[Cloudflare Plugin] Request Origin Header:', origin); // Removed

    // Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      if (origin) {
        const corsHeaders = {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie', // Add Cookie to allowed headers
          'Access-Control-Allow-Credentials': 'true', // If you need to send/receive cookies or auth headers
          'Access-Control-Max-Age': '86400' // 24 hours
        };
        // console.log('[Cloudflare Plugin] OPTIONS Preflight CORS Headers:', JSON.stringify(corsHeaders)); // Removed
        return new Response(null, {
          status: 204, // No Content
          headers: corsHeaders
        });
      } else {
        // console.log('[Cloudflare Plugin] OPTIONS Preflight: No Origin header found.'); // Removed
        return new Response(null, { status: 403 }); // Forbidden if no origin
      }
    }

    // handle the actual request
    const url = new URL(request.url);

    // this is where the proxy gets called by the frontend with the "code" that enables the
    // proxy to get the actual tokens.
    if (url.pathname === '/proxy/getAccessToken') {
      // console.log('[Cloudflare Plugin] Getting access token'); // Removed
      const code = url.searchParams.get('code');
      const redirectUri = url.searchParams.get('redirect_uri');
      if (code && redirectUri) {
        try {
          // the proxy uses the "code" to get the tokens from EEN
          const tokenResponse = await fetch('https://auth.eagleeyenetworks.com/oauth2/token', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}` // these come from worker secrets
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              scope: 'vms-all',
              redirect_uri: redirectUri
            })
          })
          const tokens = await tokenResponse.json()
          // the proxy generates a session ID to identify the refresh token for the session
          const sessionId = crypto.randomUUID()

          // the refreshtoken is put into the store with the sessionId as key
          // NOTE: We should add an expiration time based on the expire__in value.
          //       Time to live is in seconds

          await env.EEN_LOGIN.put(sessionId, tokens.refresh_token, {
            expirationTtl: tokens.expires_in
          })

          // the proxy sets a session cookie and returns the access token to the frontend
          const responseHeaders = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true' // Enable credentials
          };
          // console.log('[Cloudflare Plugin] /proxy/getAccessToken Response Headers:', JSON.stringify(responseHeaders)); // Removed
          const response = new Response(
            JSON.stringify({
              accessToken: tokens.access_token,
              expiresIn: tokens.expires_in,
              httpsBaseUrl: tokens.httpsBaseUrl
            }),
            {
              headers: responseHeaders
            }
          )

          // Set the Set-Cookie header directly on the response.headers object
          response.headers.append(
            'Set-Cookie',
            `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=None; Secure`
          )

          return response
        } catch (error) {
          return new Response('Token exchange failed', { status: 500 })
        }
      } else {
        return new Response('Authorization code missing', { status: 400 })
      }
    }

    // this is where the frontend asks the proxy to use the refresh token to generate a new access token
    // The session Id is in the header - frontend needs to make sure it is provided. 
    if (url.pathname === '/proxy/refreshAccessToken') {
      // console.log('[Cloudflare Plugin] Refreshing access token'); // Removed
      var sessionId = request.headers
        .get('Cookie')
        ?.split('; ')
        .find(cookie => cookie.startsWith('sessionId='))
        ?.split('=')[1]
      if (sessionId) {
        // this is where the session ID is used to find the refresh token
        const refreshToken = await env.EEN_LOGIN.get(sessionId)
        if (refreshToken) {
          try {
            // this is the een service that generates a new access token, and new refresh token
            const refreshResponse = await fetch('https://auth.eagleeyenetworks.com/oauth2/token', {
              method: 'POST',
              headers: {
                accept: 'application/json',
                Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
              })
            })
            const newTokens = await refreshResponse.json()

            // store the refresh token in the store
            await env.EEN_LOGIN.put(sessionId, newTokens.refresh_token, {
              expirationTtl: newTokens.expires_in
            })

            // this is the response to the Frontend
            const refreshResponseHeaders = {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Credentials': 'true'
            };
            // console.log('[Cloudflare Plugin] /proxy/refreshAccessToken Response Headers:', JSON.stringify(refreshResponseHeaders)); // Removed
            return new Response(
              JSON.stringify({
                accessToken: newTokens.access_token,
                expiresIn: newTokens.expires_in
              }),
              {
                headers: refreshResponseHeaders
              }
            )
          } catch (error) {
            // console.error('[Cloudflare Plugin] /proxy/refreshAccessToken Error:', error); // Removed
            // Optionally clear the session ID cookie on refresh failure
            return new Response('Refresh token exchange failed', { status: 401 })
          }
        } else {
          return new Response('Invalid session', { status: 401 })
        }
      } else {
        return new Response('Session ID cookie missing', { status: 401 })
      }
    }

    // Handle token revocation
    if (url.pathname === '/proxy/revoke') {
      // console.log('[Cloudflare Plugin] Revoking token'); // Removed
      var sessionId = request.headers
        .get('Cookie')
        ?.split('; ')
        .find(cookie => cookie.startsWith('sessionId='))
        ?.split('=')[1]

      // console.log('[Cloudflare Plugin] Revoking token for session:', sessionId); // Removed
      if (!sessionId) {
        return new Response('Session ID cookie missing', { status: 401 })
      }

      // Get the refresh token from KV storage
      const refreshToken = await env.EEN_LOGIN.get(sessionId)
      if (!refreshToken) {
        return new Response('Invalid session', { status: 401 })
      }

      try {
        // Call the EEN revoke endpoint
        // console.log('[Cloudflare Plugin] Revoking token for session:', sessionId); // Removed
        const revokeResponse = await fetch('https://auth.eagleeyenetworks.com/oauth2/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`
          },
          body: new URLSearchParams({
            token: refreshToken
          })
        })

        if (!revokeResponse.ok) {
          throw new Error(`Revoke failed with status: ${revokeResponse.status}`)
        }

        // Delete the session from KV storage
        // console.log('[Cloudflare Plugin] Deleting session from KV storage:', sessionId); // Removed
        await env.EEN_LOGIN.delete(sessionId)

        // Return success response with cookie removal
        const revokeResponseHeaders = {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true'
        };
        // console.log('[Cloudflare Plugin] /proxy/revoke Response Headers:', JSON.stringify(revokeResponseHeaders)); // Removed
        const response = new Response('Token revoked successfully', {
          status: 200,
          headers: revokeResponseHeaders
        })

        // Remove the cookie by setting its expiration to a past date
        // console.log('[Cloudflare Plugin] Removing cookie:', sessionId); // Removed
        response.headers.append(
          'Set-Cookie',
          `sessionId=; Path=/; HttpOnly; SameSite=None; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        )

        return response
      } catch (error) {
        return new Response('Failed to revoke token', { status: 500 })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}
