// wrangler.toml configuration for environment variables and KV binding

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code')
      if (code) {
        try {
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
          const sessionId = crypto.randomUUID()
          await env.MY_KV_NAMESPACE.put(sessionId, tokens.refresh_token)

          // Set an HTTP-only cookie with the session ID
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

    if (url.pathname === '/refresh') {
      const sessionId = request.headers
        .get('Cookie')
        ?.split('; ')
        .find(cookie => cookie.startsWith('sessionId='))
        ?.split('=')[1]
      if (sessionId) {
        const refreshToken = await env.MY_KV_NAMESPACE.get(sessionId)
        if (refreshToken) {
          try {
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
