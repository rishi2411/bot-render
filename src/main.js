'use strict';

const Renderer = require('./renderer');
const startChromium = require('./chromium');
const express = require('express');

const app = express();

app.get('/', async function(request, response) {
    var host = request.query.url && request.query.url.split("/")[2] || "";
    var hostArr = host.split(".");
    var domain = hostArr[hostArr.length - 2] || "";
    if (domain == "testbook"){
        const dom = await new Renderer(request.query.url).extractDOM(request.query.dom).catch((err) => console.error(err));
        response.send(dom);
    } else {
        response.send("Not Allowed");
    }
});

app.get('/_ah/health', (request, response) => response.send('OK'));

// Don't open a port when running from inside a module (eg. tests). Importing
// module can control this.
const chromiumStarted = startChromium();
if (chromiumStarted && !module.parent) {
  const port = process.env.PORT || '3000';
  app.listen(port, function() {
    console.log('Listening on port', port);
  });
} else if (!chromiumStarted) {
  console.error('Failed to start Chromium');
}

module.exports = app;
