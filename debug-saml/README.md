## Running Locally

1. `npm install`.
1. `npm start`.

## Running in Heroku

1. create Heroku Node.js app.
1. `heroku git:remote -a [APP_NAME]`.
1. push to Heroku remote.

## Custom SAML Connection

SignIn Endpoint: https://[APP_NAME].herokuapp.com/saml/start

```
  - &saml
    _alias: "saml"
    name: "debug-saml"
    strategy: "samlp"
    options:
      signInEndpoint: "https://[APP_NAME].herokuapp.com/saml/start"
      # signOutEndpoint: ""
      domain_aliases:
        - "debug-saml.example.com"
      # checkDestination: false
      # checkRecipient: false
      # checkInResponseTo: false
      # checkResponseID: false
      signingCert: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURyRENDQXBTZ0F3SUJBZ0lKQUl4MEJSSkxpQzYwTUEwR0NTcUdTSWIzRFFFQkN3VUFNR3N4Q3pBSkJnTlYKQkFZVEFrbE9NUlF3RWdZRFZRUUlEQXROWVdoaGNtRnphSFJ5WVRFUE1BMEdBMVVFQnd3R1RYVnRZbUZwTVE0dwpEQVlEVlFRS0RBVkJkWFJvTURFbE1DTUdDU3FHU0liM0RRRUpBUllXWVcxaFlXNHVZMmhsZG1Gc1FHRjFkR2d3CkxtTnZiVEFlRncweE56QTJNamN4TURFeE5UZGFGdzB5TnpBMk1qY3hNREV4TlRkYU1Hc3hDekFKQmdOVkJBWVQKQWtsT01SUXdFZ1lEVlFRSURBdE5ZV2hoY21GemFIUnlZVEVQTUEwR0ExVUVCd3dHVFhWdFltRnBNUTR3REFZRApWUVFLREFWQmRYUm9NREVsTUNNR0NTcUdTSWIzRFFFSkFSWVdZVzFoWVc0dVkyaGxkbUZzUUdGMWRHZ3dMbU52CmJUQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVBudFFMZ3lOUkpiZWpNUzB4UFYKZlArczhsR2FwUjZhK0pETitURDl0N2ZaRytuU0JJVGJaL29BT3c3RGNhU1FSeVZKd210alNXZTVVVVNrNFFWVAovdUFYdDlnZkdtZUVTUGZTc3pZaE5oWUJlS1E5c2hYMWtaSG5PbWZuTU1IMm9NdVd6SVAyNVIwM2RlQ2Ntd2Y4CjBkUHNzWWVtc1UrR0FYY2dlLzNTZDhxU29ETVhwV3NCcTFmN1VocmNyTk9lWDBxcUhkSHBtdGxVVXdyWUMvTU0KRmtlMXRFU1I0bnE5Ti81dDFhNUNxdm5qbE5FZzNJT1hkTlJLY1BDMFRXNFVaQ2V4Um1Gc0RYR0dmR1lPUUcvdAovd3Jad0tzVEo4RytsNVkrUFB1UXhRRW1GMW9PR0pMLytsWlZGd1IxeUVGSHE0aTJ6ektNU3MycmM0U1BVZFlKCm1YVUNBd0VBQWFOVE1GRXdIUVlEVlIwT0JCWUVGT3FJY2dwRlVua2lpbEI4ajl4VFZFeGU1cmJoTUI4R0ExVWQKSXdRWU1CYUFGT3FJY2dwRlVua2lpbEI4ajl4VFZFeGU1cmJoTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCd3JRamhOTmt2aEtLS0NtcSttK0xkUm40RnhZSXp5YWx4OS9lQnJuZnUxCnBWRU1VNXJEZFpWSzVHdWtnMFVySnNnR1UwM1hSaXZYeCt1SDFDVjh6Y096d1N1WTJnM21ZbTVIeHBIQU1ZbUUKSXJPUWVBTVBscDJMNWo2V2d6STQraC9ZdnBleThsYlppMzNlUlpUMm9OR2pKV0xBd1JFWUpKSVpOR2tpNUZSVwpvMEhpdTE2eGJaUGEwc1dJeDZzU0IybndDcEhDTWtkM0RaR3IwUlhlSHlTTWhHaThhUXRldGdhOHNJNklUZkQxCmRQSHhFaXRYNDNTZUdaY2EyeEVqanJKV082TlEvQVR2UW51cmZpYXB4SzBXVDhjRTkySzU5MUQ5c3BLaWVNSzMKWXVsNlNLeENQczMramJySkpaclAyTW9uZ3dwb2VENWZIYlZEV2RhNlllND0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQ=="
      idpinitiated:
        client_id: *client
        client_protocol: "oauth2"
        client_authorizequery: "response_type=token+id_token&scope=openid+email"
    enabled_clients:
      - *client
```