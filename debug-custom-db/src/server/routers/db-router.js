"use strict";

const url = require("url");
const zlib = require("zlib");
const crypto = require("crypto");

const _ = require("lodash");
const base64url = require("base64-url");
const Express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const redis = require("redis");
const filtrex = require("filtrex");

const store = require("./../store.js");

module.exports = function () {
  let router = Express.Router();

  router.use(cookieParser());

  router.use((req, res, next) => {
    req.script = url.parse(req.url).pathname.replace("/", "");

    store.getSettings(function (err, settings) {
      if (err) { return next(err); }

      req.settings = settings;

      console.log({ read_settings: JSON.stringify(settings) });

      next();
    });
  });

  function evaluateConditions(conditions, data) {
    if (conditions && conditions.length > 0) {
      for (let index = 0; index < conditions.length; index++) {
        var [expression, status, calls] = conditions[index].split(/\s*::\s*/);

        if (calls > 0) {
          var condition = filtrex.compileExpression(expression);

          if (condition(data)) {
            conditions[index] = [expression, status, calls - 1].join(" :: ");

            return status;
          }
        }
      }
    }

    return null;
  }

  router.get("/get_user", (req, res, next) => {
    let email = req.query.email;

    let context = { script: req.script, email: email };

    let status = evaluateConditions(req.settings.conditions, context);

    if (status) {
      store.saveSettings(req.settings, function (err) {
        if (err) { return next(err); }

        res.status(status);
        res.send();
      });

      return;
    }

    store.getUsers(function (err, users) {
      if (err) { return next(err); }

      let user = _.find(users, { email });

      if (!user) {
        res.status(404);
        res.send();
      } else {
        user = Object.assign({}, user);

        delete user.password;

        res.json(user);
      }
    });
  });

  router.post("/login", bodyParser.json(), (req, res) => {
    let email = req.body.email;

    let context = { script: req.script, email: email };

    let status = evaluateConditions(req.settings.conditions, context);

    if (status) {
      store.saveSettings(req.settings, function (err) {
        if (err) { return next(err); }

        res.status(status);
        res.send();
      });

      return;
    }

    store.getUsers(function (err, users) {
      if (err) { return next(err); }

      let password = req.body.password;

      let user = _.find(users, { email });

      if (!user) {
        res.status(404);
        res.send();
      } else if (req.settings.validate_passwords && user.password !== password) {
        res.status(400);
        res.send();
      } else {
        user = Object.assign({}, user);

        delete user.password;

        res.json(user);
      }
    });
  });

  router.post("/create", bodyParser.json(), (req, res) => {
    let email = req.body.email;

    let context = { script: req.script, email: email };

    let status = evaluateConditions(req.settings.conditions, context);

    if (status) {
      store.saveSettings(req.settings, function (err) {
        if (err) { return next(err); }

        res.status(status);
        res.send();
      });

      return;
    }

    store.getUsers(function (err, users) {
      if (err) { return next(err); }

      let user = _.find(users, { email });

      if (user) {
        res.status(409);
        res.send();
      } else {
        users.push(req.body);

        store.saveUsers(users, function (err) {
          if (err) { return next(err); }

          res.status(201);
          res.send();
        });
      }
    });
  });

  router.post("/verify", bodyParser.json(), (req, res) => {
    let email = req.body.email;

    let context = { script: req.script, email: email };

    let status = evaluateConditions(req.settings.conditions, context);

    if (status) {
      store.saveSettings(req.settings, function (err) {
        if (err) { return next(err); }

        res.status(status);
        res.send();
      });

      return;
    }

    store.getUsers(function (err, users) {
      if (err) { return next(err); }


      let user = _.find(users, { email });

      if (!user) {
        res.status(404);
        res.send();
      } else {
        user.email_verified = true;

        store.saveUsers(users, function (err) {
          if (err) { return next(err); }

          res.status(204);
          res.send();
        });
      }
    });
  });

  router.post("/change_password", bodyParser.json(), (req, res) => {
    let email = req.body.email;

    let context = { script: req.script, email: email };

    let status = evaluateConditions(req.settings.conditions, context);

    if (status) {
      store.saveSettings(req.settings, function (err) {
        if (err) { return next(err); }

        res.status(status);
        res.send();
      });

      return;
    }

    store.getUsers(function (err, users) {
      if (err) { return next(err); }

      let password = req.body.password;

      let user = _.find(users, { email });

      if (!user) {
        res.status(404);
        res.send();
      } else {
        user.password = password;

        store.saveUsers(users, function (err) {
          if (err) { return next(err); }

          res.status(204);
          res.send();
        });
      }
    });
  });

  router.use(function (error, req, res, next) {
    console.log(error);

    res.sendStatus(500);
  })

  return router;
};



