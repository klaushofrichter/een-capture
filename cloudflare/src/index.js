// wrangler.toml configuration for environment variables and KV binding

export default {

  // this is the request from the Frontend coming in
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    console.log("proxy got called with %s", url);
    
    // this is where the proxy gets called by the frontend with the "code" that enables the 
    // proxy to get the actual tokens. 
    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code')
      if (code) {
        try {

          // the proxy uses the "code" to get the tokens 
          const tokenResponse = await fetch('YOUR_AUTH_SERVER_TOKEN_ENDPOINT', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: 'YOUR_REDIRECT_URI'
            })
          })
          const tokens = await tokenResponse.json()

          // the proxy generates a session ID to identify the refresh token for the session
          const sessionId = crypto.randomUUID()

          // the refreshtoken is put into the store with the sessionId as key
          // NOTE: We should add an expiration time based on the expire__in value. 
          //       Time to live is in seconds: 
          await env.EEN_LOGIN.put(sessionId, tokens.refresh_token, {expirationTtl: expire__in})

          // the proxy sets a session cookie and returns the access token to the frontend
          // NOTE: we should return other data as well: expire__in, baseurl, port
          const response = new Response(JSON.stringify({ accessToken: tokens.access_token }), {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax`
            }
          })
          return response
        } catch (error) {
          console.error('Token exchange error:', error)
          return new Response('Token exchange failed', { status: 500 })
        }
      } else {
        return new Response('Authorization code missing', { status: 400 })
      }
    }

    // this is where the frontend asks the proxy to use the refresh token to generate a new access token
    // The session Id is in the header - frontend needs to make sure it is provided 
    if (url.pathname === '/refresh') {
      const sessionId = request.headers
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
            const refreshResponse = await fetch('YOUR_AUTH_SERVER_TOKEN_ENDPOINT', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)}`
              },
              body: new URLSearchParams({  
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: env.CLIENT_ID // May be required
              })
            })
            const newTokens = await refreshResponse.json()

            // this is the response to the Frontend
            // NOTE: possibly returning more data, such as expire__in
            // NOTE: possibly replace the stored refersh token with a new one?
            return new Response(JSON.stringify({ accessToken: newTokens.access_token }), {
              headers: { 'Content-Type': 'application/json' }
            })
          } catch (error) {
            console.error('Refresh token exchange error:', error)
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

    return new Response('Not Found', { status: 404 })
  }
}
