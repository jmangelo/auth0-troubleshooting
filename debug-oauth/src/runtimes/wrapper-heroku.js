"use strict";

const app = require("../server/app.js");

let PORT = process.env.PORT || 7100;

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))