"use strict";

const fs = require("fs");
const https = require("https");

const pem = require("pem");

const host = "dbg-oauth.localtest.me";
const port = 7100;

const app = require("../server/app.js");

let promise;

let keyFileName = `./src/runtimes/certs/dev.key`;
let certFileName = `./src/runtimes/certs/dev.crt`;

if (fs.existsSync(keyFileName) && fs.existsSync(certFileName)) {
  let options = {
    key: fs.readFileSync(keyFileName),
    cert: fs.readFileSync(certFileName)
  }

  promise = Promise.resolve(options);
} else {
  promise = new Promise((resolve, reject) => {
    pem.createCertificate({ days: 365, commonName: host, selfSigned: true }, function (err, keys) {
      if (err) { return reject(err); }

      let options = {
        key: keys.serviceKey,
        cert: keys.certificate
      };

      fs.writeFileSync(keyFileName, keys.serviceKey);
      fs.writeFileSync(certFileName, keys.certificate);

      resolve(options);
    });
  });
}

promise.then(options => {
  https.createServer(options, app).listen(port, function () {
    console.log(`Server started at: https://${host}:${port}/`);
  });
});
