const path = require("path");

const Express = require("express");
const Handlebars = require("handlebars");
const exphbs = require('express-handlebars');

const saml = require("./routers/saml-router.js");

var hbs = exphbs.create({
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: path.join(__dirname, '../views/pages'),
  partialsDir: path.join(__dirname, '../views/partials'),
  helpers: {
    "template-start": function (id) {
      return new Handlebars.SafeString(`<script type="text/x-template" id="${id}">`);
    },
    "template-end": function () {
      return new Handlebars.SafeString('</script>');
    }
  }
});

var app = new Express();

app.set('views', path.join(__dirname, '../views'))
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(Express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => res.render('index'));

app.use(`/saml/`, saml());

module.exports = app;