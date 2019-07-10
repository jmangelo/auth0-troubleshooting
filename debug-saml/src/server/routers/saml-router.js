"use strict";

const fs = require("fs");
const url = require("url");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const base64url = require("base64-url");
const Express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const Handlebars = require("handlebars");
const uuidv4 = require("uuid/v4");
const samlp = require("samlp");
const saml11 = require("saml").Saml11;
const saml20 = require("saml").Saml20;
const SignedXml = require('xml-crypto').SignedXml;

module.exports = function () {
  const constants = {};

  constants.BINDINGS = {
    HTTP_POST: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    HTTP_REDIRECT: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
  };

  constants.STATUS = {
    SUCCESS: 'urn:oasis:names:tc:SAML:2.0:status:Success',
    PARTIAL_LOGOUT: 'urn:oasis:names:tc:SAML:2.0:status:PartialLogout',
    RESPONDER: 'urn:oasis:names:tc:SAML:2.0:status:Responder'
  };

  constants.ELEMENTS = {
    LOGOUT_REQUEST: {
      PROP: 'SAMLRequest',
      SIGNATURE_VALIDATION_PATH: "//*[local-name(.)='LogoutRequest']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
      SIGNATURE_LOCATION_PATH: "//*[local-name(.)='LogoutRequest' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']",
      ISSUER_PATH: "//*[local-name(.)='Issuer' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:assertion']/text()",
      SESSION_INDEX_PATH: "//*[local-name(.)='SessionIndex' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']/text()",
      NAME_ID: "//*[local-name(.)='NameID' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:assertion']/text()"
    },
    LOGOUT_RESPONSE: {
      PROP: 'SAMLResponse',
      SIGNATURE_VALIDATION_PATH: "//*[local-name(.)='LogoutResponse']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
      SIGNATURE_LOCATION_PATH: "//*[local-name(.)='LogoutResponse' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']"
    },
    RESPONSE: {
      PROP: 'SAMLResponse',
      SIGNATURE_LOCATION_PATH: "//*[local-name(.)='Response' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']"
    },
    AUTHN_REQUEST: {
      PROP: 'SAMLRequest',
      SIGNATURE_VALIDATION_PATH: "//*[local-name(.)='AuthnRequest']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
      AUTHN_CONTEXT_CLASS_REF_PATH: "//*[local-name(.)='AuthnContextClassRef']/text()"
    },
  };

  constants.ALGORITHMS = {
    SIGNATURE: {
      'rsa-sha256': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      'rsa-sha1': 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
    },
    DIGEST: {
      'sha256': 'http://www.w3.org/2001/04/xmlenc#sha256',
      'sha1': 'http://www.w3.org/2000/09/xmldsig#sha1'
    }
  };

  let router = Express.Router();

  router.use(cookieParser());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/start", (req, res) => {
    var saml_request = req.query.SAMLRequest;

    if (saml_request) {
      zlib.inflateRaw(Buffer.from(saml_request, "base64"), (err, buffer) => {
        var data = {
          parsed_request: "[unable to decode and inflate request]",
        };

        if (!err) {
          data.parsed_request = buffer.toString("utf8");
        }

        res.render("index", data);
      });
    } else {
      res.render("index");
    }
  });

  router.post("/start", (req, res) => {
    var saml = {
      raw_request: req.body.SAMLRequest,
      relay_state: req.body.RelayState,
    };

    res.redirect(`/start?SAMLRequest=${saml.raw_request}&RelayState=${saml.relay_state}`);
  });

  router.post("/authorize", (req, res) => {
    var user = JSON.parse(base64url.decode(req.body.User));

    var saml = {
      raw_request: req.body.SAMLRequest,
      relay_state: req.body.RelayState,
      audience: req.body.Audience,
      acs_url: req.body.AcsUrl,
    }

    var attributes = {};

    var mappings = {
      "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "given_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      // "given_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/First Name",
      "family_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
      // "family_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/Last Name",
    };

    Object.keys(mappings).forEach(key => {
      if (user[key]) {
        attributes[mappings[key]] = user[key];
      }
    });

    var options = {
      cert: fs.readFileSync(path.join(__dirname, '../keys/public')),
      key: fs.readFileSync(path.join(__dirname, '../keys/private')),
      issuer: "urn:debug-saml",
      lifetimeInSeconds: 600,
      attributes: attributes,
      nameIdentifier: user.id || user.user_id || user.sub || user.email,
      sessionIndex: uuidv4(),
    };

    if (saml.raw_request) {
      // SP-Initiated

      samlp.parseRequest(req, {}, function (err, saml_request) {
        console.log(saml_request);

        options.audiences = saml_request.issuer;

        var assertion = saml20.create(options);

        var callback = saml_request.assertionConsumerServiceURL;

        if (!callback) {
          var sp = url.parse(saml_request.issuer);

          if (sp && sp.protocol === "urn:" && sp.host === "auth0") {
            let host, connection;
            [, host, connection] = sp.path.match(/\/:([\w-_]+):([\w-_]+)/);

            callback = `https://${host}.auth0.com/login/callback?connection=${connection}`;
          }
        }

        options.inResponseTo = saml_request.id;
        options.signedAssertion = assertion;
        options.samlStatusCode = constants.STATUS.SUCCESS;

        var data = {
          callback: callback,
          assertion: Buffer.from(assertion, "utf-8").toString("base64"),
          response: Buffer.from(buildSamlResponse(options), "utf-8").toString("base64"),
          state: saml.relay_state,
        };

        res.render("form_response", data);
      });
    } else {
      // IdP-Initiated

      if (saml.audience) {
        saml.audience = saml.audience.split(";");
      }

      options.audiences = saml.audience;

      var assertion = saml20.create(options);

      options.signedAssertion = assertion;
      options.samlStatusCode = constants.STATUS.SUCCESS;

      var data = {
        callback: saml.acs_url,
        assertion: Buffer.from(assertion, "utf-8").toString("base64"),
        response: Buffer.from(buildSamlResponse(options), "utf-8").toString("base64").match(/.{1,75}/g).join("\r\n"),
        state: saml.relay_state,
      };

      res.render("form_response", data);
    }

    function buildSamlResponse(options) {
      var template = '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="{{id}}" {{#if inResponseTo}}InResponseTo="{{inResponseTo}}"{{/if}} Version="2.0" IssueInstant="{{instant}}" {{#if destination}}Destination="{{destination}}"{{/if}}><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">{{issuer}}</saml:Issuer><samlp:Status><samlp:StatusCode Value="{{samlStatusCode}}"/>{{#if samlStatusMessage}}<samlp:StatusMessage Value="{{samlStatusMessage}}"/>{{/if}}</samlp:Status>{{{assertion}}}</samlp:Response>';

      var generateInstant = function () {
        var date = new Date();
        return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + date.getUTCHours()).slice(-2) + ":" + ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
      };

      var saml_response = Handlebars.compile(template)({
        id: uuidv4(),
        instant: generateInstant(),
        destination: options.destination || options.audience,
        inResponseTo: options.inResponseTo,
        issuer: options.issuer,
        samlStatusCode: options.samlStatusCode,
        samlStatusMessage: options.samlStatusMessage,
        assertion: options.signedAssertion || ''
      });

      if (options.signResponse) {
        options.signatureNamespacePrefix = typeof options.signatureNamespacePrefix === 'string' ? options.signatureNamespacePrefix : '';

        var cannonicalized = saml_response
          .replace(/\r\n/g, '')
          .replace(/\n/g, '')
          .replace(/>(\s*)</g, '><') //unindent
          .trim();

        var sig = new SignedXml(null, {
          signatureAlgorithm: constants.ALGORITHMS.SIGNATURE[options.signatureAlgorithm]
        });

        sig.addReference(
          constants.ELEMENTS.RESPONSE.SIGNATURE_LOCATION_PATH,
          ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
          constants.ALGORITHMS.DIGEST[options.digestAlgorithm]);

        sig.signingKey = options.key;

        var pem = encoders.removeHeaders(options.cert);
        sig.keyInfoProvider = {
          getKeyInfo: function (key, prefix) {
            prefix = prefix ? prefix + ':' : prefix;
            return "<" + prefix + "X509Data><" + prefix + "X509Certificate>" + pem + "</" + prefix + "X509Certificate></" + prefix + "X509Data>";
          }
        };

        sig.computeSignature(cannonicalized, {
          prefix: options.signatureNamespacePrefix,
          location: {
            action: 'after',
            reference: "//*[local-name(.)='Issuer']"
          }
        });

        saml_response = sig.getSignedXml();
      }

      return saml_response;
    }
  });

  router.use(function (error, req, res, next) {
    console.log(error);

    res.sendStatus(500);
  })

  return router;
};
