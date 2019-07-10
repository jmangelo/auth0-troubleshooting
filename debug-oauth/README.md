## Running Locally

1. `npm install`.
1. `npm start`.

## Running in Heroku

1. create Heroku Node.js app.
1. `heroku git:remote -a [APP_NAME]`.
1. push to Heroku remote.

## Custom OAuth 2.0 Connection

Authorization Endpoint: https://[APP_NAME].herokuapp.com/oauth/authorize
Token Endpoint: https://[APP_NAME].herokuapp.com/oauth/token
User Profile Endpoint: https://[APP_NAME].herokuapp.com/oauth/me?at=[ACCESS_TOKEN]

```
  - &dbg-oauth
    name: dbg-oauth
    options:
      client_id: xyz
      client_secret: itsasecret
      scripts:
        fetchUserProfile: |
          function(accessToken, ctx, cb) {
            request.get(`https://[APP_NAME].herokuapp.com/oauth/me?at=${accessToken}`, {}, function(e, r, b) {
              if (e) return cb(e);

              console.log({ ctx: ctx });

              if (r.statusCode !== 200) return cb(new Error('StatusCode|' + r.statusCode));

              cb(null, JSON.parse(b));
            });
          }
      authorizationURL: "https://[APP_NAME].herokuapp.com/oauth/authorize"
      tokenURL: https://[APP_NAME].herokuapp.com/oauth/token
    strategy: oauth2
    enabled_clients:
      - *client
```