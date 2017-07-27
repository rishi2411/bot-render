'use strict';

const CDP = require('chrome-remote-interface');

var getExpression = function(htmlElement){
    let stripScripts =
        'function stripScripts(n) {' +
          'var scripts = n.getElementsByTagName("script");' +
          'var i = scripts.length;' +
          'while (i--) {' +
            'scripts[i].parentNode.removeChild(scripts[i]);' +
          '}' +
          'return n;' +
        '};';
    if (htmlElement == 'document'){
        return stripScripts + 'stripScripts(document.documentElement).outerHTML';
    } else if (htmlElement == 'body'){
        return stripScripts + 'stripScripts(document.body).outerHTML';
    } else {
        return stripScripts + 'stripScripts(document.head).outerHTML';
    }
}

class Renderer {
  constructor(url) {
    this._url = url;
  }

  extractDOM(htmlElement) {
    return new Promise((resolve, reject) => {
      CDP.New().then((tab) => {
        return CDP({tab: tab});
      }).then((client) => {
        try {
          // Extract DevTools domains.
          const {Page, Runtime, Network} = client;

          // Enable events on domains we are interested in.
          Promise.all([
            Page.enable(),
            Runtime.enable(),
            Network.enable(),
          ]).then(() => {
            return Promise.all([
              Network.clearBrowserCache(),
              Network.setCacheDisabled({cacheDisabled: true}),
              Network.setBypassServiceWorker({bypass: true}),
            ]);
          }).then(() => {
            Page.navigate({url: this._url});
          });

          // Load and dump DOM of {head(default)|body|document} element.
          Page.loadEventFired(() => {
            setTimeout(async() => {
              let result = await Runtime.evaluate({expression: getExpression(htmlElement)});
              CDP.Close({id: client.tab.id});
              resolve(result.result.value);
            }, 1500);
          });
        } catch (err) {
          console.error(err);
          CDP.Close({id: client.tab.id});
          reject(err);
        }
      }).catch((e) => {
        reject(e);
      });
    });
  }
}

module.exports = Renderer;
