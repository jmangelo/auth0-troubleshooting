## Running Locally

1. `npm install`.
1. `npm start`.

## Running in Heroku

1. create Heroku Node.js app.
1. provision Heroku Redis addon.
1. `heroku git:remote -a [APP_NAME]`.
1. push to Heroku remote.

## Custom Database

Scripts: `https://[APP_NAME].herokuapp.com/api/db/*`


```yaml
  - &import_db
    name: "import-db"
    strategy: "auth0"
    enabled_clients:
      - *client
    options:
      import_mode: true
      passwordPolicy: null
      enabledDatabaseCustomization: true
      customScripts:
        login: |
          function login(email, password, callback) {
            console.log({ script: "login", email: email });
          
            var axios = require("axios@0.18.0");
            var client = axios.create({ baseURL: 'https://[APP_NAME].herokuapp.com/api/db' });
          
            client.post("/login", { email: email, password: password }, {
              validateStatus: (status) => [200,400,404,418].includes(status),
            }).then(function (response) {
              console.log({ script: "login", status: response.status });
          
              switch (response.status) {
                case 200:
                  return callback(null, response.data);
          
                case 400:
                  return callback(new WrongUsernameOrPasswordError(email, "wrong_password"));
          
                case 404:
                  return callback(new WrongUsernameOrPasswordError(email, "wrong_email"));

                case 418:
                  return callback(new Error(response.data));
              }
            }).catch(callback);
          }
        get_user: |
          function get_user(email, callback) {
            console.log({ script: "get_user", email: email });
          
            var axios = require("axios@0.18.0");
            var client = axios.create({ baseURL: 'https://[APP_NAME].herokuapp.com/api/db' });
          
            client.get("/get_user", {
              params: { email: email },
              validateStatus: (status) => [200,404,418].includes(status),
            }).then(function (response) {
              console.log({ script: "get_user", status: response.status, user: response.data });

              switch (response.status) {
                case 200:
                  return callback(null, response.data);
          
                case 404:
                  return callback(null);

                case 418:
                  return callback(new Error(response.data));
              }
            }).catch(callback);
          }
```

