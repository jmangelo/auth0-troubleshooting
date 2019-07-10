"use strict";

const url = require("url");
const zlib = require("zlib");
const crypto = require("crypto");

const base64url = require("base64-url");
const Express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

module.exports = function () {
  let router = Express.Router();

  let dictionary = Buffer.from("useremail_verifiedgiven_namefamilygenderbirthdatelocalenicksettingsissue_refresh_tokenerrorsat_authorizeat_tokenerror_descriptionerror_uristatusexample.orgtruefalse", "utf8");

  router.use(cookieParser());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/authorize", (req, res) => {
    res.render("index");
  });

  router.get("/debug", (req, res) => {
    let code = req.query.code;

    if (code) {
      zlib.inflate(Buffer.from(base64url.unescape(code), "base64"), { dictionary: dictionary }, (err, buffer) => {
        if (!err) {
          res.json(JSON.parse(buffer.toString("utf8")));
        } else {
          next(err, req, res);
        }
      });
    } else {
      res.json({});
    }
  });

  router.post("/authorize", (req, res) => {
    let settings = req.cookies["settings"];

    if (settings) {
      settings = JSON.parse(settings);
    } else {
      settings = {};
    }

    let payload = {
      user: JSON.parse(base64url.decode(req.body.user)),
      settings: settings,
    };

    if (settings.errors && settings.errors.at_authorize && settings.errors.at_authorize.error) {
      let info = settings.errors.at_authorize;

      let url = `${req.body.redirect_uri}?error=${info.error}`;

      if (info.error_description) {
        url += `&error_description=${info.error_description}`;
      }

      if (info.error_uri) {
        url += `&error_uri=${info.error_uri}`;
      }

      if (req.body.state) {
        url += `&state=${req.body.state}`;
      }

      return res.redirect(url);
    }

    zlib.deflate(JSON.stringify(payload), { level: 9, dictionary: dictionary }, (err, buffer) => {
      if (!err) {
        payload = base64url.escape(buffer.toString("base64"));

        let url = `${req.body.redirect_uri}?code=${payload}`;

        if (req.body.state) {
          url += `&state=${req.body.state}`;
        }

        res.redirect(url);
      } else {
        next(err, req, res);
      }
    });
  });

  router.post("/token", (req, res) => {
    zlib.inflate(Buffer.from(base64url.unescape(req.body.code), "base64"), { dictionary: dictionary }, (err, buffer) => {
      if (!err) {
        let payload = JSON.parse(buffer.toString("utf8"));
        let settings = payload.settings;

        if (settings.errors && settings.errors.at_authorize && settings.errors.at_token.error) {
          let info = settings.errors.at_token;

          let error = (({ error, error_description, error_uri }) => ({ error, error_description, error_uri }))(info);

          res.status(info.status || 400);

          return res.json(error);
        }

        let response = {
          access_token: req.body.code,
          token_type: "Bearer",
          expires_at: 86400
        };

        if (payload.settings.issue_refresh_token) {
          response.refresh_token = base64url.escape(crypto.randomBytes(16).toString("base64"));
        }

        res.json(response);
      } else {
        next(err, req, res);
      }
    });
  });

  router.get("/me", (req, res) => {
    zlib.inflate(Buffer.from(base64url.unescape(req.query.at), "base64"), { dictionary: dictionary }, (err, buffer) => {
      if (!err) {
        let payload = JSON.parse(buffer.toString("utf8"));

        res.json(payload.user);
      } else {
        next(err, req, res);
      }
    });
  });

  router.use(function (error, req, res, next) {
    console.log(error);

    res.sendStatus(500);
  })

  return router;
};
