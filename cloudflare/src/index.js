// wrangler.toml configuration for environment variables and KV binding

export default {
  // this is the request from the Frontend coming in
  // eslint-disable-next-line no-unused-vars
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin')

    // Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      if (origin) {
        console.log('origin: ', origin)
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*', // Or a specific origin
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add any other allowed headers
          'Access-Control-Allow-Credentials': 'true', // If you need to send/receive cookies or auth headers
          'Access-Control-Max-Age': '86400' // 24 hours
        }
        return new Response(null, {
          status: 204, // No Content
          headers: corsHeaders
        })
      } else {
        return new Response(null, { status: 403 }) // Forbidden if no origin
      }
    }

    // handle the actual request
    const url = new URL(request.url)
    //console.log('proxy got called with ', url)

    // this is where the proxy gets called by the frontend with the "code" that enables the
    // proxy to get the actual tokens.
    if (url.pathname === '/getAccessToken') {
      const code = url.searchParams.get('code')
      const redirectUri = url.searchParams.get('redirect_uri')
      //console.log('code: ', code)
      //console.log('redirectUri: ', redirectUri)
      if (code && redirectUri) {
        try {
          // the proxy uses the "code" to get the tokens from EEN
          //console.log('fetching token from EEN with code and redirectUri ', code, redirectUri)
          //console.log('env.CLIENT_ID: ', env.CLIENT_ID)
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
          //console.log('tokens message from een: ', tokens)
          // the proxy generates a session ID to identify the refresh token for the session
          const sessionId = crypto.randomUUID()
          //console.log('tokens returned from EEN: ', tokens)

          // the refreshtoken is put into the store with the sessionId as key
          // NOTE: We should add an expiration time based on the expire__in value.
          //       Time to live is in seconds
          await env.EEN_LOGIN.put(sessionId, tokens.refresh_token, {
            expirationTtl: tokens.expires_in
          })

          // the proxy sets a session cookie and returns the access token to the frontend
          //console.log('tokens.expires_in: ', tokens.expires_in)
          const response = new Response(
            JSON.stringify({
              accessToken: tokens.access_token,
              expiresIn: tokens.expires_in,
              httpsBaseUrl: tokens.httpsBaseUrl,
              sessionId: sessionId
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Or a specific origin
                'Access-Control-Allow-Credentials': 'true' // If you need to send/receive cookies or auth headers
              }
            }
          )

          // Set the Set-Cookie header directly on the response.headers object
          //response.headers.append('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax`)
          response.headers.append(
            'Set-Cookie',
            `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
          ) // Keep Lax for now

          //console.log('response: ', response)
          return response
        } catch (error) {
          //console.error('Token exchange error:', error)
          return new Response('Token exchange failed', { status: 500 })
        }
      } else {
        //console.log('Authorization code missing')
        return new Response('Authorization code missing', { status: 400 })
      }
    }

    // this is where the frontend asks the proxy to use the refresh token to generate a new access token
    // The session Id is in the header - frontend needs to make sure it is provided
    if (url.pathname === '/refreshAccessToken') {
      console.log('refreshAccessToken: header: ', JSON.stringify(request.headers))
      console.log('refreshAccessToken: body: ', JSON.stringify(request.body))
      var sessionId = request.headers
        .get('Cookie')
        ?.split('; ')
        .find(cookie => cookie.startsWith('sessionId='))
        ?.split('=')[1]
      if (!sessionId) {
        console.log('refresh: sessionId cookie missing as cookie, trying to get it from the URL')
        sessionId = url.searchParams.get('sessionId')
        console.log('refresh: sessionId from URL: ', sessionId)
      }
      if (sessionId) {
        // this is where the session ID is used to find the refresh token
        console.log('refreshToken - using sessionid to get refresh token: sessionId: ', sessionId)
        const refreshToken = await env.EEN_LOGIN.get(sessionId)
        console.log('refreshToken from KV: ', refreshToken)
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
            console.log('newTokens from refresh: ', newTokens)

            // store the refresh token in the store
            await env.EEN_LOGIN.put(sessionId, newTokens.refresh_token, {
              expirationTtl: newTokens.expires_in
            })
            console.log(
              'new refresh token stored in the store, sending access token back to the frontend'
            )

            // this is the response to the Frontend
            // NOTE: do we need to return the sessionId?
            return new Response(
              JSON.stringify({
                accessToken: newTokens.access_token,
                expiresIn: newTokens.expires_in
              }),
              {
                headers: { 'Content-Type': 'application/json' }
              }
            )
          } catch (error) {
            //console.error('Refresh token exchange error:', error)
            // Optionally clear the session ID cookie on refresh failure
            return new Response('Refresh token exchange failed', { status: 401 })
          }
        } else {
          return new Response('Invalid session', { status: 401 })
        }
      } else {
        //console.log('refresh: sessionId cookie missing')
        return new Response('Session ID cookie missing', { status: 401 })
      }
    }
    return new Response('Not Found', { status: 404 })
  }
}
