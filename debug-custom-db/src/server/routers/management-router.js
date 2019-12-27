"use strict";

const url = require("url");
const zlib = require("zlib");
const crypto = require("crypto");

const base64url = require("base64-url");
const Express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const redis = require("redis");

const store = require("./../store.js");

module.exports = function () {
  let router = Express.Router();

  router.use(cookieParser());

  router.get("/settings", (req, res, next) => {
    store.getSettings(function (err, settings) {
      if (err) { return next(err); }

      res.json(settings);
    });
  });

  router.post("/settings", bodyParser.json(), (req, res) => {
    let settings = req.body;

    console.log({ save_settings: JSON.stringify(settings) });

    let client = redis.createClient(process.env.REDIS_URL);

    client.set("settings", JSON.stringify(settings));

    client.quit();

    res.status(200);
    res.send();
  });

  router.get("/users", (req, res, next) => {
    store.getUsers(function (err, users) {
      if (err) { return next(err); }

      res.json(users);
    });
  });

  router.post("/users", bodyParser.json(), (req, res) => {
    let users = req.body;

    let client = redis.createClient(process.env.REDIS_URL);

    client.set("users", JSON.stringify(users));

    client.quit();

    res.status(200);
    res.send();
  });

  router.delete("/users", (req, res) => {
    let client = redis.createClient(process.env.REDIS_URL);

    client.del("users");

    client.quit();

    res.status(200);
    res.send();
  });

  router.use(function (error, req, res, next) {
    console.log(error);

    res.sendStatus(500);
  })

  return router;
};
